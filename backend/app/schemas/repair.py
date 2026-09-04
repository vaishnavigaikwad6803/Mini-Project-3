from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.repair import RepairStage

class RepairBase(BaseModel):
    current_stage: RepairStage = RepairStage.ASSIGNED
    inspection_remarks: Optional[str] = None
    completion_remarks: Optional[str] = None
    materials_used: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None

class RepairUpdateStage(BaseModel):
    current_stage: RepairStage
    remarks: Optional[str] = None
    materials_used: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None

class RepairCompletionRequest(BaseModel):
    completion_remarks: str
    materials_used: Optional[str] = None
    actual_cost: Optional[float] = None

class RepairVerificationRequest(BaseModel):
    verification_remarks: str
    is_approved: bool = True  # If true, marks Closed; if false, reverts to Repair In Progress

class RepairResponse(RepairBase):
    id: int
    complaint_id: str
    engineer_id: int
    inspection_date: Optional[datetime] = None
    repair_start_date: Optional[datetime] = None
    repair_completion_date: Optional[datetime] = None
    repair_before_image: Optional[str] = None
    repair_after_image: Optional[str] = None
    inspection_image: Optional[str] = None
    verified_by_authority_id: Optional[int] = None
    verification_remarks: Optional[str] = None
    verification_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    engineer_name: Optional[str] = None
    engineer_employee_id: Optional[str] = None
    authority_name: Optional[str] = None

    class Config:
        from_attributes = True
