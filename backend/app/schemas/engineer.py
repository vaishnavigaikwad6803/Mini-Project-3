from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.engineer import EngineerStatus

class EngineerBase(BaseModel):
    employee_id: str
    designation: str = "Junior Road Maintenance Engineer"
    specialization: str = "Bituminous Pavement & Surface Repairs"
    status: EngineerStatus = EngineerStatus.ACTIVE

class EngineerCreate(EngineerBase):
    user_id: int
    authority_id: int

class EngineerRegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str = "Engineer@123"
    phone: Optional[str] = None
    authority_id: Optional[int] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = "Junior Road Maintenance Engineer"
    specialization: Optional[str] = "Bituminous Pavement & Surface Repairs"
    district: Optional[str] = "Mumbai Suburban"
    state: Optional[str] = "Maharashtra"

class EngineerUpdate(BaseModel):
    designation: Optional[str] = None
    specialization: Optional[str] = None
    status: Optional[EngineerStatus] = None
    authority_id: Optional[int] = None

class EngineerResponse(EngineerBase):
    id: int
    user_id: int
    authority_id: int
    active_workload: int
    created_at: datetime
    updated_at: datetime
    
    # Nested user details
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    authority_name: Optional[str] = None

    class Config:
        from_attributes = True

class EngineerAssignmentRequest(BaseModel):
    engineer_id: int
    remarks: Optional[str] = None
