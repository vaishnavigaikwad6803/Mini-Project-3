from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: UserRole
    authority_id: Optional[int] = None
    engineer_id: Optional[int] = None

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    district: Optional[str] = None
    state: Optional[str] = None
    authority_id: Optional[int] = None  # If authority officer or engineer
    employee_id: Optional[str] = None   # If engineer

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
