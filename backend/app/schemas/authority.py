from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.authority import AuthorityType

class AuthorityBase(BaseModel):
    code: str
    name: str
    authority_type: AuthorityType
    road_type_coverage: str
    state: str
    district: str
    jurisdiction_area: Optional[str] = None
    contact_email: str
    contact_phone: str
    is_active: bool = True

class AuthorityCreate(AuthorityBase):
    pass

class AuthorityUpdate(BaseModel):
    name: Optional[str] = None
    authority_type: Optional[AuthorityType] = None
    road_type_coverage: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    jurisdiction_area: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None

class AuthorityResponse(AuthorityBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuthorityStatsResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    under_review_complaints: int
    in_repair_complaints: int
    completed_complaints: int
    total_engineers: int
    active_engineers: int
