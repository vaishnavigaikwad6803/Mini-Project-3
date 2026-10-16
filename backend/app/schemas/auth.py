from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.models.user import UserRole
from app.auth.security import validate_password_strength

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: UserRole
    is_verified: bool = True
    authority_id: Optional[int] = None
    engineer_id: Optional[int] = None

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    district: Optional[str] = None
    state: Optional[str] = None
    authority_id: Optional[int] = None
    employee_id: Optional[str] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        val = v.strip()
        if len(val) < 2:
            raise ValueError("Full name must be at least 2 characters.")
        return val

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        valid, msg = validate_password_strength(v)
        if not valid:
            raise ValueError(msg)
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Password confirmation does not match password.")
        return self

class RegisterResponse(BaseModel):
    message: str
    user_id: int
    email: str
    full_name: str
    is_verified: bool = False
    requires_email_verification: bool = True

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("otp")
    @classmethod
    def normalize_otp(cls, v: str) -> str:
        val = v.strip()
        if not val:
            raise ValueError("Verification code is required.")
        return val

class ResendOtpRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class ResetPasswordRequest(BaseModel):
    token: Optional[str] = None
    otp: Optional[str] = None
    email: Optional[EmailStr] = None
    new_password: str
    confirm_password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().lower() if v else None

    @field_validator("new_password")
    @classmethod
    def validate_new_pwd(cls, v: str) -> str:
        valid, msg = validate_password_strength(v)
        if not valid:
            raise ValueError(msg)
        return v

    @model_validator(mode="after")
    def validate_reset_data(self):
        if not self.token and not (self.otp and self.email):
            raise ValueError("Either a reset token or email + reset code must be provided.")
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: Optional[str] = None

    @field_validator("new_password")
    @classmethod
    def validate_new_pwd(cls, v: str) -> str:
        valid, msg = validate_password_strength(v)
        if not valid:
            raise ValueError(msg)
        return v

    @model_validator(mode="after")
    def check_confirm(self):
        if self.confirm_password is not None and self.new_password != self.confirm_password:
            raise ValueError("New password and confirmation do not match.")
        return self

class GenericMessageResponse(BaseModel):
    message: str
    success: bool = True
