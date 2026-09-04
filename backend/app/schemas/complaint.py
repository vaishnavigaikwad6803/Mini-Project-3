from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.complaint import ComplaintStatus, RoadType, PriorityLevel
from app.schemas.ai_result import AIResultResponse
from app.schemas.repair import RepairResponse

class StatusHistoryResponse(BaseModel):
    id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by_role: Optional[str] = None
    remarks: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ComplaintBase(BaseModel):
    road_name: str
    road_type: RoadType
    description: Optional[str] = None
    latitude: float
    longitude: float
    district: str
    state: str
    landmark: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus
    remarks: Optional[str] = None

class ComplaintDeleteRequest(BaseModel):
    reason: str

class ComplaintResponse(ComplaintBase):
    id: str
    citizen_id: int
    authority_id: Optional[int] = None
    image_url: Optional[str] = None
    status: ComplaintStatus
    priority: PriorityLevel
    routing_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Enriched fields
    citizen_name: Optional[str] = None
    citizen_email: Optional[str] = None
    authority_name: Optional[str] = None
    primary_damage_type: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_severity: Optional[str] = None
    engineer_id: Optional[int] = None
    engineer_name: Optional[str] = None
    engineer_employee_id: Optional[str] = None
    engineer_phone: Optional[str] = None
    repair_id: Optional[int] = None
    repair: Optional[RepairResponse] = None

    class Config:
        from_attributes = True

class ComplaintDetailResponse(ComplaintResponse):
    ai_result: Optional[AIResultResponse] = None
    repair: Optional[RepairResponse] = None
    status_history: List[StatusHistoryResponse] = []

class MapComplaintResponse(BaseModel):
    id: str
    road_name: str
    road_type: RoadType
    status: ComplaintStatus
    priority: PriorityLevel
    latitude: float
    longitude: float
    district: str
    state: str
    image_url: Optional[str] = None
    damage_type: Optional[str] = None
    authority_name: Optional[str] = None
    engineer_id: Optional[int] = None
    engineer_name: Optional[str] = None
    engineer_employee_id: Optional[str] = None
    engineer_phone: Optional[str] = None
    engineer_email: Optional[str] = None
    engineer_designation: Optional[str] = None
    engineer_specialization: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CitizenStatsResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    under_review_complaints: int
    in_repair_complaints: int
    completed_complaints: int
