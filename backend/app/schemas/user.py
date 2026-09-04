from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.user import UserRole

class UserBase(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    district: Optional[str] = None
    state: Optional[str] = None
    authority_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserProfileResponse(UserResponse):
    authority_id: Optional[int] = None
    authority_name: Optional[str] = None
    engineer_id: Optional[int] = None
    total_complaints_submitted: Optional[int] = 0
