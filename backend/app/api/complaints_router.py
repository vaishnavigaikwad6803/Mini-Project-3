import os
import json
import uuid
import logging
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus, RoadType, PriorityLevel
from app.models.ai_result import AIResult, DamageClass, SeverityLevel
from app.models.authority import Authority
from app.models.notification import NotificationType
from app.schemas.complaint import (
    ComplaintResponse,
    ComplaintDetailResponse,
    ComplaintStatusUpdate,
    ComplaintDeleteRequest,
    CitizenStatsResponse
)
from app.schemas.ai_result import AIResultResponse
from app.schemas.repair import RepairResponse
from app.auth.dependencies import get_current_user, get_optional_current_user, require_citizen, require_authority, require_admin
from app.utils.file_storage import save_upload_image
from app.ai.detector import get_detector
from app.services.routing_service import determine_responsible_authority
from app.services.notification_service import create_notification, notify_authority_officers
from app.services.timeline_service import record_status_change

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def enrich_complaint_response(complaint: Complaint) -> dict:
    """Helper to convert Complaint model to dict enriched with related data."""
    eng_id = None
    eng_name = None
    eng_emp_id = None
    eng_phone = None
    if complaint.repair and complaint.repair.engineer:
        eng_id = complaint.repair.engineer.id
        eng_emp_id = complaint.repair.engineer.employee_id
        if complaint.repair.engineer.user:
            eng_name = complaint.repair.engineer.user.full_name
            eng_phone = complaint.repair.engineer.user.phone

    primary_damage = None
    if complaint.ai_result and complaint.ai_result.primary_damage_type:
        primary_damage = complaint.ai_result.primary_damage_type.value
    elif complaint.description:
        # Extract damage label if present
        primary_damage = complaint.description.split('.')[0] if '.' in complaint.description else complaint.description
    if not primary_damage or len(primary_damage) > 50:
        primary_damage = "Road Defect"

    data = {
        "id": complaint.id,
        "citizen_id": complaint.citizen_id,
        "authority_id": complaint.authority_id,
        "road_name": complaint.road_name,
        "road_type": complaint.road_type,
        "description": complaint.description,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "district": complaint.district,
        "state": complaint.state,
        "landmark": complaint.landmark,
        "image_url": complaint.image_url,
        "status": complaint.status,
        "priority": complaint.priority,
        "routing_notes": complaint.routing_notes,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "citizen_name": complaint.citizen.full_name if complaint.citizen else "Citizen",
        "citizen_email": complaint.citizen.email if complaint.citizen else None,
        "authority_name": complaint.authority.name if complaint.authority else "Unassigned",
        "primary_damage_type": primary_damage,
        "ai_confidence": complaint.ai_result.confidence_score if complaint.ai_result else None,
        "ai_severity": complaint.ai_result.severity.value if (complaint.ai_result and complaint.ai_result.severity) else (complaint.priority.value if complaint.priority else "Medium"),
        "engineer_id": eng_id,
        "engineer_name": eng_name,
        "engineer_employee_id": eng_emp_id,
        "engineer_phone": eng_phone,
        "repair_id": complaint.repair.id if complaint.repair else None,
        "repair": {
            "id": complaint.repair.id,
            "complaint_id": complaint.repair.complaint_id,
            "engineer_id": complaint.repair.engineer_id,
            "current_stage": complaint.repair.current_stage,
            "inspection_remarks": complaint.repair.inspection_remarks,
            "inspection_date": complaint.repair.inspection_date,
            "inspection_image": complaint.repair.inspection_image,
            "repair_start_date": complaint.repair.repair_start_date,
            "repair_completion_date": complaint.repair.repair_completion_date,
            "completion_remarks": complaint.repair.completion_remarks,
            "repair_before_image": complaint.repair.repair_before_image,
            "repair_after_image": complaint.repair.repair_after_image,
            "materials_used": complaint.repair.materials_used,
            "estimated_cost": complaint.repair.estimated_cost,
            "actual_cost": complaint.repair.actual_cost,
            "verified_by_authority_id": complaint.repair.verified_by_authority_id,
            "verification_remarks": complaint.repair.verification_remarks,
            "verification_date": complaint.repair.verification_date,
            "created_at": complaint.repair.created_at,
            "updated_at": complaint.repair.updated_at,
            "engineer_name": eng_name,
            "engineer_employee_id": eng_emp_id,
            "authority_name": complaint.authority.name if complaint.authority else None,
        } if complaint.repair else None,
    }
    return data

@router.post("", response_model=ComplaintDetailResponse)
async def submit_complaint(
    road_image: Optional[UploadFile] = File(None),
    road_name: str = Form(...),
    road_type: RoadType = Form(...),
    description: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    district: str = Form(...),
    state: str = Form(...),
    landmark: Optional[str] = Form(None),
    damage_type: Optional[str] = Form(None),
    priority: Optional[PriorityLevel] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a new road damage complaint:
    1. Saves road image (if provided) and runs AI detection
    2. Supports Map-Click direct damage report without image
    3. Auto-routes to responsible Authority
    4. Records status timeline
    5. Dispatches notifications
    """
    web_img_url = None
    abs_img_path = None
    
    logger.info(f"[Complaint GPS Debug] Submission received: Latitude={latitude}, Longitude={longitude}, District='{district}', State='{state}', Road='{road_name}'")
    if road_image and road_image.filename:
        try:
            abs_img_path, web_img_url = await save_upload_image(road_image, subfolder="complaints")
            detector = get_detector()
            val_res = detector.validate_image(abs_img_path)
            logger.info(
                f"[Complaint AI Debug] Stage 1 Validation: Result={val_res['road_validation_result']}, "
                f"Confidence={val_res['road_validation_confidence']}, Allowed={val_res['yolo_allowed']}"
            )
            if not val_res["is_valid"]:
                if abs_img_path and os.path.exists(abs_img_path):
                    try:
                        os.remove(abs_img_path)
                    except Exception:
                        pass
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=val_res["error_message"]
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Image – Please capture a clear image of the road and reported damage."
            )

    # Generate unique Complaint ID
    random_suffix = uuid.uuid4().hex[:6].upper()
    complaint_id = f"RGD-{datetime.utcnow().year}-{random_suffix}"

    initial_priority = priority or PriorityLevel.MEDIUM
    desc = description or (f"{damage_type or 'Road Defect'} reported on {road_name}")

    # Create initial complaint
    complaint = Complaint(
        id=complaint_id,
        citizen_id=current_user.id,
        road_name=road_name,
        road_type=road_type,
        description=desc,
        latitude=latitude,
        longitude=longitude,
        district=district,
        state=state,
        landmark=landmark,
        image_url=web_img_url or "",
        status=ComplaintStatus.SUBMITTED,
        priority=initial_priority
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Initial timeline entry
    record_status_change(
        db=db,
        complaint_id=complaint.id,
        from_status=None,
        to_status=ComplaintStatus.SUBMITTED.value,
        user_id=current_user.id,
        role_name="Citizen",
        remarks="Damage reported via Maharashtra GIS Map Location."
    )

    # If image was provided, run AI detection pipeline
    ai_result_obj = None
    if abs_img_path:
        try:
            detector = get_detector()
            ai_output = detector.run_detection(abs_img_path)
            
            if ai_output["severity"] == SeverityLevel.CRITICAL:
                complaint.priority = PriorityLevel.CRITICAL
            elif ai_output["severity"] == SeverityLevel.HIGH:
                complaint.priority = PriorityLevel.HIGH
            elif ai_output["severity"] == SeverityLevel.LOW:
                complaint.priority = PriorityLevel.LOW

            ai_result_obj = AIResult(
                complaint_id=complaint.id,
                primary_damage_type=ai_output["primary_damage_type"],
                confidence_score=ai_output["confidence_score"],
                severity=ai_output["severity"],
                damage_count=ai_output["damage_count"],
                detections_json=json.dumps(ai_output["detections"]),
                annotated_image_url=ai_output["annotated_image_url"],
                model_version=ai_output["model_version"],
                processing_time_ms=ai_output["processing_time_ms"],
                disclaimer=ai_output["disclaimer"]
            )
            db.add(ai_result_obj)
            complaint.status = ComplaintStatus.AI_ANALYZED
            db.commit()
            
            record_status_change(
                db=db,
                complaint_id=complaint.id,
                from_status=ComplaintStatus.SUBMITTED.value,
                to_status=ComplaintStatus.AI_ANALYZED.value,
                user_id=None,
                role_name="AI System",
                remarks=f"YOLOv8 detected {ai_output['damage_count']} defects ({ai_output['primary_damage_type'].value}) with {int(ai_output['confidence_score']*100)}% confidence. Severity rated {ai_output['severity'].value}."
            )
        except Exception as ex:
            pass

    # Determine Responsible Authority & Route
    authority, routing_notes = determine_responsible_authority(
        db=db,
        road_type=road_type,
        district=district,
        state=state
    )
    
    if authority:
        complaint.authority_id = authority.id
        from_stat = complaint.status.value
        complaint.status = ComplaintStatus.AUTHORITY_ASSIGNED
        complaint.routing_notes = routing_notes
        db.commit()
        
        record_status_change(
            db=db,
            complaint_id=complaint.id,
            from_status=from_stat,
            to_status=ComplaintStatus.AUTHORITY_ASSIGNED.value,
            user_id=None,
            role_name="Authority Router",
            remarks=routing_notes
        )
        
        # Notify Authority Officers
        damage_desc = damage_type or (ai_result_obj.primary_damage_type.value if ai_result_obj else 'Road Defect')
        notify_authority_officers(
            db=db,
            authority_id=authority.id,
            title=f"New Road Damage Report [{complaint.id}]",
            message=f"New {complaint.road_type.value} damage reported in {district}, {state}. Defect: {damage_desc} ({complaint.priority.value} Priority).",
            complaint_id=complaint.id
        )

    # Notify Citizen
    create_notification(
        db=db,
        user_id=current_user.id,
        title=f"Road Damage Report Created [{complaint.id}]",
        message=f"Your road damage report on {road_name} ({district}) has been logged and assigned to {authority.name if authority else 'responsible authority'}.",
        notif_type=NotificationType.INFO,
        complaint_id=complaint.id
    )

    db.refresh(complaint)
    return get_complaint_by_id(complaint.id, current_user=current_user, db=db)

@router.get("", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[ComplaintStatus] = Query(None),
    road_type: Optional[RoadType] = Query(None),
    district: Optional[str] = Query(None),
    authority_id: Optional[int] = Query(None),
    priority: Optional[PriorityLevel] = Query(None),
    my_complaints: bool = Query(False),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves filtered complaints according to user role and query parameters."""
    query = db.query(Complaint)
    
    # Role-based scoping
    if current_user.role == UserRole.CITIZEN or my_complaints:
        query = query.filter(Complaint.citizen_id == current_user.id)
    elif current_user.role == UserRole.AUTHORITY:
        # If user has specific authority profile or district
        if authority_id:
            query = query.filter(Complaint.authority_id == authority_id)
        elif current_user.district:
            auth = db.query(Authority).filter(Authority.district.ilike(f"%{current_user.district}%")).first()
            if auth:
                query = query.filter(Complaint.authority_id == auth.id)
    elif current_user.role == UserRole.ENGINEER and current_user.engineer_profile:
        # Engineers can see complaints assigned to their authority or directly to them
        query = query.filter(Complaint.authority_id == current_user.engineer_profile.authority_id)

    # Apply filters
    if status:
        query = query.filter(Complaint.status == status)
    if road_type:
        query = query.filter(Complaint.road_type == road_type)
    if district:
        query = query.filter(Complaint.district.ilike(f"%{district}%"))
    if priority:
        query = query.filter(Complaint.priority == priority)
    if search:
        query = query.filter(
            (Complaint.id.ilike(f"%{search}%")) |
            (Complaint.road_name.ilike(f"%{search}%")) |
            (Complaint.district.ilike(f"%{search}%")) |
            (Complaint.description.ilike(f"%{search}%"))
        )

    complaints = query.order_by(desc(Complaint.created_at)).offset(skip).limit(limit).all()
    return [enrich_complaint_response(c) for c in complaints]

@router.get("/citizen/stats", response_model=CitizenStatsResponse)
def get_citizen_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns complaint counts and status breakdown for the logged-in citizen."""
    base = db.query(Complaint).filter(Complaint.citizen_id == current_user.id)
    total = base.count()
    pending = base.filter(Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.AI_ANALYZED])).count()
    under_review = base.filter(Complaint.status.in_([ComplaintStatus.AUTHORITY_ASSIGNED, ComplaintStatus.UNDER_REVIEW])).count()
    in_repair = base.filter(Complaint.status.in_([
        ComplaintStatus.ENGINEER_ASSIGNED,
        ComplaintStatus.INSPECTION_PENDING,
        ComplaintStatus.INSPECTION_COMPLETED,
        ComplaintStatus.REPAIR_STARTED,
        ComplaintStatus.REPAIR_IN_PROGRESS,
        ComplaintStatus.REPAIR_COMPLETED,
        ComplaintStatus.AUTHORITY_VERIFICATION
    ])).count()
    completed = base.filter(Complaint.status == ComplaintStatus.CLOSED).count()

    return CitizenStatsResponse(
        total_complaints=total,
        pending_complaints=pending,
        under_review_complaints=under_review,
        in_repair_complaints=in_repair,
        completed_complaints=completed
    )

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_by_id(
    complaint_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Returns full details of a complaint including AI analysis, repair progress, and timeline."""
    clean_id = complaint_id.strip()
    complaint = db.query(Complaint).filter(Complaint.id.ilike(clean_id)).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{clean_id}' not found."
        )

    enriched = enrich_complaint_response(complaint)

    # Format AI result
    ai_res_dict = None
    if complaint.ai_result:
        det_list = []
        try:
            det_list = json.loads(complaint.ai_result.detections_json)
        except Exception:
            det_list = []
            
        ai_res_dict = {
            "id": complaint.ai_result.id,
            "complaint_id": complaint.ai_result.complaint_id,
            "primary_damage_type": complaint.ai_result.primary_damage_type,
            "confidence_score": complaint.ai_result.confidence_score,
            "severity": complaint.ai_result.severity,
            "damage_count": complaint.ai_result.damage_count,
            "detections": det_list,
            "annotated_image_url": complaint.ai_result.annotated_image_url,
            "model_version": complaint.ai_result.model_version,
            "processing_time_ms": complaint.ai_result.processing_time_ms,
            "detection_timestamp": complaint.ai_result.detection_timestamp,
            "disclaimer": complaint.ai_result.disclaimer,
        }

    # Format Repair details
    repair_dict = None
    if complaint.repair:
        r = complaint.repair
        repair_dict = {
            "id": r.id,
            "complaint_id": r.complaint_id,
            "engineer_id": r.engineer_id,
            "current_stage": r.current_stage,
            "inspection_remarks": r.inspection_remarks,
            "inspection_date": r.inspection_date,
            "inspection_image": r.inspection_image,
            "repair_start_date": r.repair_start_date,
            "repair_completion_date": r.repair_completion_date,
            "completion_remarks": r.completion_remarks,
            "repair_before_image": r.repair_before_image,
            "repair_after_image": r.repair_after_image,
            "materials_used": r.materials_used,
            "estimated_cost": r.estimated_cost,
            "actual_cost": r.actual_cost,
            "verified_by_authority_id": r.verified_by_authority_id,
            "verification_remarks": r.verification_remarks,
            "verification_date": r.verification_date,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "engineer_name": r.engineer.user.full_name if (r.engineer and r.engineer.user) else None,
            "engineer_employee_id": r.engineer.employee_id if r.engineer else None,
            "authority_name": r.engineer.authority.name if (r.engineer and r.engineer.authority) else None,
        }

    # Format Status History Timeline
    history_list = [
        {
            "id": h.id,
            "from_status": h.from_status,
            "to_status": h.to_status,
            "changed_by_role": h.changed_by_role,
            "remarks": h.remarks,
            "timestamp": h.timestamp
        }
        for h in complaint.status_history
    ]

    enriched["ai_result"] = ai_res_dict
    enriched["repair"] = repair_dict
    enriched["status_history"] = history_list

    return ComplaintDetailResponse(**enriched)

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: str,
    update_data: ComplaintStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates complaint status and appends timeline log (Authority / Admin only)."""
    if current_user.role not in [UserRole.AUTHORITY, UserRole.ADMIN, UserRole.ENGINEER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    old_status = complaint.status.value
    complaint.status = update_data.status
    db.commit()

    record_status_change(
        db=db,
        complaint_id=complaint.id,
        from_status=old_status,
        to_status=update_data.status.value,
        user_id=current_user.id,
        role_name=current_user.role.value,
        remarks=update_data.remarks or f"Status transitioned to {update_data.status.value}."
    )

    # Notify Citizen
    create_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Complaint #{complaint.id} Update",
        message=f"Your complaint status has been updated to '{update_data.status.value}'. {update_data.remarks or ''}",
        complaint_id=complaint.id,
        notif_type=NotificationType.INFO
    )

    db.refresh(complaint)
    return enrich_complaint_response(complaint)

@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: str,
    request: ComplaintDeleteRequest,
    current_user: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    """
    Authority Officer or Admin deletes a complaint.
    Mandates a valid deletion reason.
    Notifies the citizen and safely cleans up records.
    """
    if not request.reason or len(request.reason.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A specific reason for deletion (minimum 3 characters) is required."
        )

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Decrement engineer active workload if repair was in progress
    if complaint.repair and complaint.repair.engineer:
        complaint.repair.engineer.active_workload = max(0, (complaint.repair.engineer.active_workload or 1) - 1)

    # Notify Citizen
    citizen_id = complaint.citizen_id
    auth_name = current_user.full_name or "Authority Officer"
    road_name = complaint.road_name

    create_notification(
        db=db,
        user_id=citizen_id,
        title=f"Complaint #{complaint_id} Deleted",
        message=f"Your complaint for {road_name} was deleted by {auth_name}. Reason: {request.reason.strip()}",
        complaint_id=None,
        notif_type=NotificationType.WARNING
    )

    db.delete(complaint)
    db.commit()

    return {"message": "Complaint deleted successfully.", "complaint_id": complaint_id, "reason": request.reason.strip()}
