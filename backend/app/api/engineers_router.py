from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.engineer import Engineer, EngineerStatus
from app.models.authority import Authority
from app.models.complaint import Complaint, ComplaintStatus
from app.models.repair import Repair, RepairStage
from app.models.notification import NotificationType
from app.schemas.engineer import (
    EngineerCreate,
    EngineerRegisterRequest,
    EngineerUpdate,
    EngineerResponse,
    EngineerAssignmentRequest
)
from app.schemas.complaint import ComplaintResponse
from app.api.complaints_router import enrich_complaint_response
from app.auth.dependencies import get_current_user, require_admin, require_authority
from app.auth.security import get_password_hash
from app.services.notification_service import create_notification
from app.services.timeline_service import record_status_change
import uuid

router = APIRouter(prefix="/engineers", tags=["Engineers"])

def format_engineer_response(eng: Engineer) -> dict:
    return {
        "id": eng.id,
        "user_id": eng.user_id,
        "authority_id": eng.authority_id,
        "employee_id": eng.employee_id,
        "designation": eng.designation,
        "specialization": eng.specialization,
        "active_workload": eng.active_workload,
        "status": eng.status,
        "created_at": eng.created_at,
        "updated_at": eng.updated_at,
        "full_name": eng.user.full_name if eng.user else "Unknown",
        "email": eng.user.email if eng.user else "Unknown",
        "phone": eng.user.phone if eng.user else None,
        "authority_name": eng.authority.name if eng.authority else None,
    }

@router.post("/register", response_model=EngineerResponse)
def register_engineer(
    data: EngineerRegisterRequest,
    current_user: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    """
    Registers a new maintenance engineer for the authority (Authority Officer / Admin only).
    Creates User credentials, Engineer profile record, and links to the authority.
    """
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Determine authority_id
    auth_id = data.authority_id
    if not auth_id:
        # Check current user's authority
        if current_user.district:
            auth = db.query(Authority).filter(Authority.district.ilike(f"%{current_user.district}%")).first()
            if auth:
                auth_id = auth.id
        if not auth_id:
            auth = db.query(Authority).first()
            if auth:
                auth_id = auth.id
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid Authority found.")

    # Generate employee ID if not provided
    emp_id = data.employee_id
    if not emp_id or not emp_id.strip():
        auth_obj = db.query(Authority).filter(Authority.id == auth_id).first()
        prefix = auth_obj.code if auth_obj else "ENG"
        random_code = uuid.uuid4().hex[:4].upper()
        emp_id = f"ENG-{prefix}-{random_code}"

    # Verify unique employee_id
    existing_eng = db.query(Engineer).filter(Engineer.employee_id == emp_id).first()
    if existing_eng:
        emp_id = f"ENG-{uuid.uuid4().hex[:6].upper()}"

    # Create User
    hashed_pwd = get_password_hash(data.password or "Engineer@123")
    user = User(
        email=data.email.lower(),
        hashed_password=hashed_pwd,
        full_name=data.full_name,
        phone=data.phone,
        role=UserRole.ENGINEER,
        district=data.district or (current_user.district if current_user else "Mumbai Suburban"),
        state=data.state or "Maharashtra",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create Engineer Profile
    engineer = Engineer(
        user_id=user.id,
        authority_id=auth_id,
        employee_id=emp_id,
        designation=data.designation or "Junior Road Maintenance Engineer",
        specialization=data.specialization or "Bituminous Pavement & Surface Repairs",
        status=EngineerStatus.ACTIVE,
        active_workload=0
    )
    db.add(engineer)
    db.commit()
    db.refresh(engineer)

    # Welcome notification
    create_notification(
        db=db,
        user_id=user.id,
        title="Welcome to RoadGuard AI Field Ops!",
        message=f"You have been registered as an authorized Road Maintenance Engineer ({emp_id}).",
        notif_type=NotificationType.SUCCESS
    )

    return format_engineer_response(engineer)

@router.get("", response_model=List[EngineerResponse])
def get_engineers(
    authority_id: Optional[int] = Query(None),
    status: Optional[EngineerStatus] = Query(None),
    db: Session = Depends(get_db)
):
    """Lists engineers with optional authority and status filters."""
    query = db.query(Engineer)
    if authority_id:
        query = query.filter(Engineer.authority_id == authority_id)
    if status:
        query = query.filter(Engineer.status == status)
    engineers = query.all()
    return [format_engineer_response(e) for e in engineers]

@router.get("/{engineer_id}", response_model=EngineerResponse)
def get_engineer_by_id(engineer_id: int, db: Session = Depends(get_db)):
    """Returns details of a specific engineer."""
    eng = db.query(Engineer).filter(Engineer.id == engineer_id).first()
    if not eng:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engineer not found.")
    return format_engineer_response(eng)

@router.put("/{engineer_id}", response_model=EngineerResponse)
def update_engineer(
    engineer_id: int,
    data: EngineerUpdate,
    current_user: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    """Updates engineer details or status (Authority / Admin only)."""
    eng = db.query(Engineer).filter(Engineer.id == engineer_id).first()
    if not eng:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engineer not found.")

    for field, val in data.dict(exclude_unset=True).items():
        setattr(eng, field, val)

    db.commit()
    db.refresh(eng)
    return format_engineer_response(eng)

@router.post("/assign-to-complaint")
def assign_engineer_to_complaint(
    complaint_id: str = Query(...),
    request: EngineerAssignmentRequest = Depends(),
    current_user: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    """
    Authority Officer or Admin assigns an Engineer to a road complaint:
    1. Updates complaint status to 'Engineer Assigned'
    2. Creates or links Repair tracking record
    3. Increments engineer's active workload
    4. Appends audit log to timeline
    5. Dispatches notifications to Engineer and Citizen
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    engineer = db.query(Engineer).filter(Engineer.id == request.engineer_id).first()
    if not engineer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engineer not found.")

    old_status = complaint.status.value
    complaint.status = ComplaintStatus.ENGINEER_ASSIGNED
    
    # Check or create repair record
    repair = db.query(Repair).filter(Repair.complaint_id == complaint_id).first()
    if not repair:
        repair = Repair(
            complaint_id=complaint_id,
            engineer_id=engineer.id,
            current_stage=RepairStage.ASSIGNED
        )
        db.add(repair)
    else:
        repair.engineer_id = engineer.id
        repair.current_stage = RepairStage.ASSIGNED

    engineer.active_workload = (engineer.active_workload or 0) + 1
    db.commit()

    # Timeline entry
    record_status_change(
        db=db,
        complaint_id=complaint.id,
        from_status=old_status,
        to_status=ComplaintStatus.ENGINEER_ASSIGNED.value,
        user_id=current_user.id,
        role_name=current_user.role.value,
        remarks=f"Assigned to Engineer {engineer.user.full_name} ({engineer.employee_id}). Remarks: {request.remarks or 'Assigned for site inspection and repair schedule.'}"
    )

    # Notify Engineer
    create_notification(
        db=db,
        user_id=engineer.user_id,
        title=f"New Assignment: Complaint #{complaint.id}",
        message=f"You have been assigned to inspect and repair {complaint.road_name} ({complaint.district}). Priority: {complaint.priority.value}.",
        complaint_id=complaint.id,
        notif_type=NotificationType.WARNING
    )

    # Notify Citizen
    create_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Engineer Assigned for #{complaint.id}",
        message=f"Engineer {engineer.user.full_name} from {complaint.authority.name if complaint.authority else 'the Authority'} has been assigned to your complaint.",
        complaint_id=complaint.id,
        notif_type=NotificationType.INFO
    )

    return {"message": "Engineer assigned successfully.", "complaint_id": complaint.id, "engineer_id": engineer.id}

@router.get("/{engineer_id}/assignments", response_model=List[ComplaintResponse])
def get_engineer_assignments(
    engineer_id: int,
    db: Session = Depends(get_db)
):
    """Returns all complaints assigned to a specific engineer."""
    repairs = db.query(Repair).filter(Repair.engineer_id == engineer_id).all()
    complaint_ids = [r.complaint_id for r in repairs]
    complaints = db.query(Complaint).filter(Complaint.id.in_(complaint_ids)).order_by(Complaint.created_at.desc()).all()
    return [enrich_complaint_response(c) for c in complaints]
