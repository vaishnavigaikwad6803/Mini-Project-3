from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint, ComplaintStatus
from app.models.repair import Repair, RepairStage
from app.models.notification import NotificationType
from app.schemas.repair import (
    RepairResponse,
    RepairUpdateStage,
    RepairCompletionRequest,
    RepairVerificationRequest
)
from app.auth.dependencies import get_current_user, require_engineer, require_authority
from app.utils.file_storage import save_upload_image
from app.services.notification_service import create_notification, notify_authority_officers
from app.services.timeline_service import record_status_change

router = APIRouter(prefix="/repairs", tags=["Repairs & Maintenance"])

def format_repair_response(r: Repair) -> dict:
    return {
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

@router.get("/{repair_id}", response_model=RepairResponse)
def get_repair_by_id(repair_id: int, db: Session = Depends(get_db)):
    """Returns repair details."""
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair record not found.")
    return format_repair_response(repair)

@router.patch("/{repair_id}/stage", response_model=RepairResponse)
def update_repair_stage(
    repair_id: int,
    data: RepairUpdateStage,
    current_user: User = Depends(require_engineer),
    db: Session = Depends(get_db)
):
    """Engineer transitions repair through progressive milestones."""
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair record not found.")

    complaint = repair.complaint
    old_stage = repair.current_stage.value

    # Strict Requirement: If marking repair as completed, repair_after_image must be present
    if data.current_stage == RepairStage.REPAIR_COMPLETED and not repair.repair_after_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A photograph of the completed repair is strictly mandatory to mark the repair completed."
        )

    repair.current_stage = data.current_stage
    
    if data.remarks:
        if data.current_stage == RepairStage.INSPECTION_COMPLETED:
            repair.inspection_remarks = data.remarks
            repair.inspection_date = datetime.utcnow()
        elif data.current_stage in [RepairStage.REPAIR_STARTED, RepairStage.REPAIR_IN_PROGRESS]:
            if not repair.repair_start_date:
                repair.repair_start_date = datetime.utcnow()
                
    if data.materials_used:
        repair.materials_used = data.materials_used
    if data.estimated_cost is not None:
        repair.estimated_cost = data.estimated_cost
    if data.actual_cost is not None:
        repair.actual_cost = data.actual_cost

    # Sync complaint status with repair stage
    stage_to_status_map = {
        RepairStage.INSPECTION_PENDING: ComplaintStatus.INSPECTION_PENDING,
        RepairStage.INSPECTION_COMPLETED: ComplaintStatus.INSPECTION_COMPLETED,
        RepairStage.REPAIR_STARTED: ComplaintStatus.REPAIR_STARTED,
        RepairStage.REPAIR_IN_PROGRESS: ComplaintStatus.REPAIR_IN_PROGRESS,
        RepairStage.REPAIR_COMPLETED: ComplaintStatus.REPAIR_COMPLETED,
        RepairStage.AUTHORITY_VERIFICATION: ComplaintStatus.AUTHORITY_VERIFICATION,
        RepairStage.CLOSED: ComplaintStatus.CLOSED,
    }
    
    if data.current_stage in stage_to_status_map:
        complaint.status = stage_to_status_map[data.current_stage]

    db.commit()

    # Timeline entry
    record_status_change(
        db=db,
        complaint_id=complaint.id,
        from_status=old_stage,
        to_status=data.current_stage.value,
        user_id=current_user.id,
        role_name="Engineer",
        remarks=data.remarks or f"Repair stage updated to {data.current_stage.value}"
    )

    # Notify Citizen
    create_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Repair Progress #{complaint.id}",
        message=f"Work status updated to '{data.current_stage.value}'. Engineer remarks: {data.remarks or 'No remarks'}",
        complaint_id=complaint.id,
        notif_type=NotificationType.INFO
    )

    db.refresh(repair)
    return format_repair_response(repair)

@router.post("/{repair_id}/complete", response_model=RepairResponse)
async def submit_repair_completion(
    repair_id: int,
    completion_image: UploadFile = File(...),
    completion_remarks: str = Form(...),
    materials_used: Optional[str] = Form(None),
    actual_cost: Optional[float] = Form(None),
    current_user: User = Depends(require_engineer),
    db: Session = Depends(get_db)
):
    """
    Engineer uploads repaired road photo, materials used, and completion remarks.
    Transitions repair stage to 'Repair Completed' and complaint status to 'Authority Verification'.
    """
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair record not found.")

    _, web_url = await save_upload_image(completion_image, subfolder="repairs")
    
    complaint = repair.complaint
    old_status = complaint.status.value

    repair.repair_after_image = web_url
    repair.completion_remarks = completion_remarks
    repair.repair_completion_date = datetime.utcnow()
    repair.current_stage = RepairStage.REPAIR_COMPLETED
    if materials_used:
        repair.materials_used = materials_used
    if actual_cost is not None:
        repair.actual_cost = actual_cost

    complaint.status = ComplaintStatus.AUTHORITY_VERIFICATION
    db.commit()

    record_status_change(
        db=db,
        complaint_id=complaint.id,
        from_status=old_status,
        to_status=ComplaintStatus.REPAIR_COMPLETED.value,
        user_id=current_user.id,
        role_name="Engineer",
        remarks=f"Repair completed by Engineer. Completion remarks: {completion_remarks}"
    )

    # Notify Authority Officer for verification
    if complaint.authority_id:
        notify_authority_officers(
            db=db,
            authority_id=complaint.authority_id,
            title=f"Verification Required: Complaint #{complaint.id}",
            message=f"Engineer {current_user.full_name} has completed repairs for {complaint.road_name}. Please review completion photos and verify.",
            complaint_id=complaint.id
        )

    # Notify Citizen
    create_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Repair Completed for #{complaint.id}",
        message="The field engineer has completed the road repair work. The complaint is now under final authority verification.",
        complaint_id=complaint.id,
        notif_type=NotificationType.SUCCESS
    )

    db.refresh(repair)
    return format_repair_response(repair)

@router.post("/{repair_id}/verify", response_model=RepairResponse)
def verify_and_close_repair(
    repair_id: int,
    request: RepairVerificationRequest,
    current_user: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    """
    Authority Officer reviews repair completion and marks complaint CLOSED (or requests rework).
    """
    repair = db.query(Repair).filter(Repair.id == repair_id).first()
    if not repair:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair record not found.")

    complaint = repair.complaint
    old_status = complaint.status.value

    repair.verified_by_authority_id = current_user.id
    repair.verification_remarks = request.verification_remarks
    repair.verification_date = datetime.utcnow()

    if request.is_approved:
        repair.current_stage = RepairStage.CLOSED
        complaint.status = ComplaintStatus.CLOSED
        
        # Decrement engineer active workload
        if repair.engineer:
            repair.engineer.active_workload = max(0, (repair.engineer.active_workload or 1) - 1)

        new_status = ComplaintStatus.CLOSED.value
        status_msg = f"Repair verified and closed by Authority Officer {current_user.full_name}. Remarks: {request.verification_remarks}"
    else:
        # Revert for rework
        repair.current_stage = RepairStage.REPAIR_IN_PROGRESS
        complaint.status = ComplaintStatus.REPAIR_IN_PROGRESS
        new_status = ComplaintStatus.REPAIR_IN_PROGRESS.value
        status_msg = f"Authority verification requested rework: {request.verification_remarks}"

    db.commit()

    record_status_change(
        db=db,
        complaint_id=complaint.id,
        from_status=old_status,
        to_status=new_status,
        user_id=current_user.id,
        role_name="Authority",
        remarks=status_msg
    )

    # Notify Citizen
    create_notification(
        db=db,
        user_id=complaint.citizen_id,
        title=f"Complaint #{complaint.id} Resolved & Closed",
        message=f"Your complaint has been successfully verified by {current_user.full_name} and marked as CLOSED. Thank you for making our roads safer!",
        complaint_id=complaint.id,
        notif_type=NotificationType.SUCCESS
    )

    # Notify Engineer
    if repair.engineer:
        create_notification(
            db=db,
            user_id=repair.engineer.user_id,
            title=f"Repair Verification: #{complaint.id}",
            message=f"Authority Officer verified your repair for {complaint.road_name}: {request.verification_remarks}",
            complaint_id=complaint.id,
            notif_type=NotificationType.SUCCESS if request.is_approved else NotificationType.WARNING
        )

    db.refresh(repair)
    return format_repair_response(repair)
