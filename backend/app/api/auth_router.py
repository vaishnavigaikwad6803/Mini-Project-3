from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.engineer import Engineer, EngineerStatus
from app.models.authority import Authority, AuthorityType
from app.models.auth_tokens import EmailVerification, PasswordReset, RefreshToken, LoginAttempt
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    VerifyEmailRequest,
    ResendOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    LogoutRequest,
    ChangePasswordRequest,
    Token,
    GenericMessageResponse,
)
from app.schemas.user import UserProfileResponse
from app.auth.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    generate_otp,
    hash_token,
    verify_token_hash,
    generate_secure_token,
)
from app.auth.dependencies import get_current_user
from app.services.notification_service import create_notification
from app.services.email_service import (
    send_verification_otp_email,
    send_password_reset_email,
    send_password_changed_notification,
    get_dev_email_inbox,
)
from app.models.notification import NotificationType

router = APIRouter(prefix="/auth", tags=["Authentication"])


def resolve_authority_for_user(user: User, db: Session):
    """Resolves corresponding Authority for an AUTHORITY user using email, jurisdiction and district."""
    auth = None
    email = (user.email or "").lower()
    
    if "nhai" in email:
        auth = db.query(Authority).filter(Authority.authority_type == AuthorityType.NATIONAL_HIGHWAY).first()
    elif "pwd" in email:
        auth = db.query(Authority).filter(Authority.authority_type == AuthorityType.STATE_HIGHWAY).first()
    elif "bmc" in email or "municipal" in email:
        auth = db.query(Authority).filter(Authority.authority_type == AuthorityType.MUNICIPAL).first()
    elif "pmgsy" in email or "rural" in email:
        auth = db.query(Authority).filter(Authority.authority_type == AuthorityType.RURAL_ROAD).first()
        
    if not auth and user.district:
        auth = db.query(Authority).filter(Authority.district.ilike(f"%{user.district}%")).first()
        
    if not auth:
        auth = db.query(Authority).first()
        
    return auth


def check_login_rate_limit(email: str, ip_address: Optional[str], db: Session):
    """Checks if the account or IP is temporarily restricted due to repeated failed logins."""
    query = db.query(LoginAttempt).filter(LoginAttempt.email == email)
    if ip_address:
        query = query.filter((LoginAttempt.email == email) | (LoginAttempt.ip_address == ip_address))
    
    attempt = query.order_by(LoginAttempt.last_attempt_at.desc()).first()
    if attempt and attempt.locked_until:
        if datetime.utcnow() < attempt.locked_until:
            remaining_secs = int((attempt.locked_until - datetime.utcnow()).total_seconds())
            remaining_mins = max(1, (remaining_secs + 59) // 60)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Access temporarily restricted. Please try again in {remaining_mins} minute(s)."
            )
        else:
            # Lockout expired, reset counter
            attempt.failed_attempts = 0
            attempt.locked_until = None
            db.commit()


def record_failed_login(email: str, ip_address: Optional[str], db: Session):
    """Records a failed login attempt and applies a lockout if threshold is exceeded."""
    attempt = db.query(LoginAttempt).filter(LoginAttempt.email == email).first()
    if not attempt:
        attempt = LoginAttempt(
            email=email,
            ip_address=ip_address,
            failed_attempts=1,
            last_attempt_at=datetime.utcnow()
        )
        db.add(attempt)
    else:
        attempt.failed_attempts += 1
        attempt.ip_address = ip_address
        attempt.last_attempt_at = datetime.utcnow()

    if attempt.failed_attempts >= settings.MAX_LOGIN_ATTEMPTS:
        attempt.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOGIN_LOCKOUT_MINUTES)
    
    db.commit()


def clear_failed_logins(email: str, db: Session):
    """Clears failed login attempts after successful authentication."""
    db.query(LoginAttempt).filter(LoginAttempt.email == email).delete()
    db.commit()


def generate_and_save_refresh_token(user_id: int, db: Session, request: Optional[Request] = None) -> str:
    """Generates a cryptographically secure refresh token and records its hash in the database."""
    raw_token = generate_secure_token(48)
    token_h = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    user_agent = request.headers.get("user-agent") if request else None
    ip = request.client.host if request and request.client else None

    refresh_rec = RefreshToken(
        user_id=user_id,
        token_hash=token_h,
        expires_at=expires_at,
        is_revoked=False,
        user_agent=user_agent[:250] if user_agent else None,
        ip_address=ip[:95] if ip else None
    )
    db.add(refresh_rec)
    db.commit()
    return raw_token


def issue_token_bundle(user: User, db: Session, request: Optional[Request] = None) -> Token:
    """Creates an access token and refresh token for a verified active user."""
    authority_id = None
    engineer_id = None

    if user.role == UserRole.ENGINEER and user.engineer_profile:
        engineer_id = user.engineer_profile.id
        authority_id = user.engineer_profile.authority_id
    elif user.role == UserRole.AUTHORITY:
        auth = resolve_authority_for_user(user, db)
        if auth:
            authority_id = auth.id

    extra_claims = {
        "email": user.email,
        "role": user.role.value,
        "authority_id": authority_id,
        "engineer_id": engineer_id,
    }
    access_token = create_access_token(subject=user.id, extra_claims=extra_claims)
    refresh_token = generate_and_save_refresh_token(user.id, db, request)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_verified=user.is_verified,
        authority_id=authority_id,
        engineer_id=engineer_id
    )


# --------------------------------------------------------------------------
# 1. User Registration & Email Verification Dispatch
# --------------------------------------------------------------------------

@router.post("/register", response_model=RegisterResponse)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registers a new user account with hashed password.
    Generates a secure 6-digit OTP and sends verification email.
    The account remains unverified until OTP is successfully validated.
    """
    normalized_email = request.email.strip().lower()

    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists. Please log in or use a different email."
        )

    # Hash password with bcrypt
    hashed_pwd = get_password_hash(request.password)

    user = User(
        email=normalized_email,
        hashed_password=hashed_pwd,
        full_name=request.full_name.strip(),
        phone=request.phone.strip() if request.phone else None,
        role=request.role,
        district=request.district.strip() if request.district else None,
        state=request.state.strip() if request.state else None,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If registering as engineer, link to engineer table
    if request.role == UserRole.ENGINEER and request.authority_id:
        emp_id = request.employee_id or f"ENG-{user.id:04d}"
        engineer = Engineer(
            user_id=user.id,
            authority_id=request.authority_id,
            employee_id=emp_id,
            status=EngineerStatus.ACTIVE
        )
        db.add(engineer)
        db.commit()

    return RegisterResponse(
        message="Registration successful! You can now log in with your credentials.",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_verified=True,
        requires_email_verification=False
    )


# --------------------------------------------------------------------------
# 2. Email Verification with OTP
# --------------------------------------------------------------------------

@router.post("/verify-email", response_model=Token)
def verify_email(
    request: VerifyEmailRequest,
    http_req: Request,
    db: Session = Depends(get_db)
):
    """
    Validates the 6-digit OTP provided by the user.
    On success: marks account verified, invalidates OTP, and returns active authentication tokens.
    """
    normalized_email = request.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not found. Please verify your email address or register again."
        )

    if user.is_verified:
        # Already verified; log in directly
        return issue_token_bundle(user, db, http_req)

    # Retrieve latest active verification record
    verification = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id, EmailVerification.is_used == False)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found. Please request a new code using 'Resend Code'."
        )

    # Check expiration
    if datetime.utcnow() > verification.expires_at:
        verification.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new verification code."
        )

    # Check maximum attempt threshold
    if verification.attempts >= settings.MAX_OTP_ATTEMPTS:
        verification.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. This code has been invalidated. Please request a new code."
        )

    # Validate OTP using constant-time hash comparison
    if not verify_token_hash(request.otp, verification.otp_hash):
        verification.attempts += 1
        db.commit()
        remaining = settings.MAX_OTP_ATTEMPTS - verification.attempts
        if remaining > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining} attempt(s) remaining."
            )
        else:
            verification.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Maximum attempts reached. Please request a new code."
            )

    # OTP validated successfully
    verification.is_used = True
    user.is_verified = True
    db.commit()

    # Welcome notification
    create_notification(
        db=db,
        user_id=user.id,
        title="Email Verified Successfully!",
        message="Your email has been verified. Welcome to RoadGuard AI! You now have full access to reporting and tracking.",
        notif_type=NotificationType.SUCCESS
    )

    return issue_token_bundle(user, db, http_req)


@router.post("/resend-otp", response_model=GenericMessageResponse)
def resend_otp(
    request: ResendOtpRequest,
    db: Session = Depends(get_db)
):
    """
    Resends a fresh OTP code with strict cooldown period and rate limiting.
    """
    normalized_email = request.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No account found with this email address."
        )

    if user.is_verified:
        return GenericMessageResponse(
            message="Your email address is already verified. You can log in directly.",
            success=True
        )

    # Check cooldown and rate limits from latest verification entry
    latest = (
        db.query(EmailVerification)
        .filter(EmailVerification.user_id == user.id)
        .order_by(EmailVerification.created_at.desc())
        .first()
    )

    if latest:
        elapsed_seconds = (datetime.utcnow() - latest.last_sent_at).total_seconds()
        if elapsed_seconds < settings.RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.RESEND_COOLDOWN_SECONDS - elapsed_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} second(s) before requesting another verification code."
            )

        if latest.resend_count >= 5:
            # Check if last sent was recent (within 1 hour)
            if elapsed_seconds < 3600:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Maximum resend attempts reached for this session. Please try again later."
                )

    # Invalidate previous unused verification entries
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user.id,
        EmailVerification.is_used == False
    ).update({"is_used": True})

    # Generate new OTP
    otp_code = generate_otp(6)
    otp_h = hash_token(otp_code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    prior_resends = (latest.resend_count + 1) if latest else 1

    new_verification = EmailVerification(
        user_id=user.id,
        email=normalized_email,
        otp_hash=otp_h,
        expires_at=expires_at,
        attempts=0,
        resend_count=prior_resends,
        last_sent_at=datetime.utcnow(),
        is_used=False
    )
    db.add(new_verification)
    db.commit()

    # Dispatch email
    send_verification_otp_email(
        to_email=user.email,
        full_name=user.full_name,
        otp_code=otp_code,
        expiry_minutes=settings.OTP_EXPIRE_MINUTES
    )

    return GenericMessageResponse(
        message=f"A fresh verification code has been sent to {user.email}. It is valid for {settings.OTP_EXPIRE_MINUTES} minutes.",
        success=True
    )


# --------------------------------------------------------------------------
# 3. Login Authentication & Session Management
# --------------------------------------------------------------------------

@router.post("/login", response_model=Token)
def login_user(
    request: LoginRequest,
    http_req: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticates user credentials.
    Enforces password verification, account activation, rate limiting, and email verification.
    """
    normalized_email = request.email.strip().lower()
    client_ip = http_req.client.host if http_req.client else None

    # Enforce brute-force lockout prevention
    check_login_rate_limit(normalized_email, client_ip, db)

    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        record_failed_login(normalized_email, client_ip, db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )

    # Successful login: reset failed login attempts
    clear_failed_logins(normalized_email, db)

    return issue_token_bundle(user, db, http_req)


@router.post("/refresh", response_model=Token)
def refresh_token(
    request: RefreshTokenRequest,
    http_req: Request,
    db: Session = Depends(get_db)
):
    """
    Refreshes access token using a valid, non-revoked refresh token.
    Rotates the refresh token for enhanced security.
    """
    token_h = hash_token(request.refresh_token)
    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_h, RefreshToken.is_revoked == False)
        .first()
    )

    if not stored_token or datetime.utcnow() > stored_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again."
        )

    user = db.query(User).filter(User.id == stored_token.user_id).first()
    if not user or not user.is_active or not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account inactive or unverified."
        )

    # Token rotation: revoke old refresh token
    stored_token.is_revoked = True
    db.commit()

    return issue_token_bundle(user, db, http_req)


@router.post("/logout", response_model=GenericMessageResponse)
def logout_user(
    request: LogoutRequest,
    db: Session = Depends(get_db)
):
    """
    Logs out the user and revokes their refresh token session in the database.
    """
    if request.refresh_token:
        token_h = hash_token(request.refresh_token)
        db.query(RefreshToken).filter(RefreshToken.token_hash == token_h).update({"is_revoked": True})
        db.commit()

    return GenericMessageResponse(message="Successfully logged out.", success=True)


# --------------------------------------------------------------------------
# 4. Forgot Password & Secure Password Reset
# --------------------------------------------------------------------------

@router.post("/forgot-password", response_model=GenericMessageResponse)
def forgot_password(
    request: ForgotPasswordRequest,
    http_req: Request,
    db: Session = Depends(get_db)
):
    """
    Initiates password recovery.
    Returns a generic message regardless of email existence to prevent user enumeration attacks.
    """
    normalized_email = request.email.strip().lower()

    # Rate limiting: max 3 requests per 15 minutes per email
    recent_resets = (
        db.query(PasswordReset)
        .filter(
            PasswordReset.email == normalized_email,
            PasswordReset.created_at >= datetime.utcnow() - timedelta(minutes=15)
        )
        .count()
    )
    if recent_resets >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please wait 15 minutes before trying again."
        )

    user = db.query(User).filter(User.email == normalized_email).first()

    if user and user.is_active:
        # Invalidate previous unused resets
        db.query(PasswordReset).filter(
            PasswordReset.user_id == user.id,
            PasswordReset.is_used == False
        ).update({"is_used": True})

        # Generate cryptographically secure token and 6-digit code
        raw_token = generate_secure_token(32)
        raw_code = generate_otp(6)
        token_h = hash_token(raw_token)
        code_h = hash_token(raw_code)

        reset_entry = PasswordReset(
            user_id=user.id,
            email=normalized_email,
            token_hash=token_h,
            otp_hash=code_h,
            expires_at=datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
            attempts=0,
            is_used=False
        )
        db.add(reset_entry)
        db.commit()

        # Send password reset email
        send_password_reset_email(
            to_email=user.email,
            full_name=user.full_name,
            reset_token=raw_token,
            reset_code=raw_code,
            expiry_minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES
        )

    # Always return identical response to prevent email harvesting
    return GenericMessageResponse(
        message="If an account with that email address is registered, instructions to reset your password have been sent to your inbox.",
        success=True
    )


@router.post("/reset-password", response_model=GenericMessageResponse)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Completes password reset using either the secure link token or 6-digit reset code.
    Hashes the new password with bcrypt and revokes existing sessions.
    """
    reset_entry: Optional[PasswordReset] = None

    if request.token:
        token_h = hash_token(request.token)
        reset_entry = (
            db.query(PasswordReset)
            .filter(PasswordReset.token_hash == token_h, PasswordReset.is_used == False)
            .first()
        )
    elif request.otp and request.email:
        normalized_email = request.email.strip().lower()
        user = db.query(User).filter(User.email == normalized_email).first()
        if user:
            candidate = (
                db.query(PasswordReset)
                .filter(PasswordReset.user_id == user.id, PasswordReset.is_used == False)
                .order_by(PasswordReset.created_at.desc())
                .first()
            )
            if candidate and candidate.otp_hash and verify_token_hash(request.otp, candidate.otp_hash):
                reset_entry = candidate

    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link or code. Please request a new password reset."
        )

    if datetime.utcnow() > reset_entry.expires_at:
        reset_entry.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link or code has expired. Please submit a new request."
        )

    target_user = db.query(User).filter(User.id == reset_entry.user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account associated with this reset request was not found."
        )

    # Securely update user password with bcrypt
    target_user.hashed_password = get_password_hash(request.new_password)
    # Ensure account is also verified if they completed email-based reset
    target_user.is_verified = True
    reset_entry.is_used = True

    # Revoke all active refresh token sessions across all devices for security
    db.query(RefreshToken).filter(RefreshToken.user_id == target_user.id).update({"is_revoked": True})
    db.commit()

    # Send security notification email
    send_password_changed_notification(target_user.email, target_user.full_name)

    return GenericMessageResponse(
        message="Your password has been successfully updated. You may now log in with your new password.",
        success=True
    )


# --------------------------------------------------------------------------
# 5. User Profile & Change Password (Authenticated)
# --------------------------------------------------------------------------

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns profile details of the authenticated user."""
    auth_id = None
    auth_name = None
    eng_id = None
    
    if current_user.role == UserRole.ENGINEER and current_user.engineer_profile:
        eng_id = current_user.engineer_profile.id
        auth_id = current_user.engineer_profile.authority_id
        if current_user.engineer_profile.authority:
            auth_name = current_user.engineer_profile.authority.name
    elif current_user.role == UserRole.AUTHORITY:
        auth = resolve_authority_for_user(current_user, db)
        if auth:
            auth_id = auth.id
            auth_name = auth.name

    total_submitted = len(current_user.complaints) if current_user.complaints else 0

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        district=current_user.district,
        state=current_user.state,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        authority_id=auth_id,
        authority_name=auth_name,
        engineer_id=eng_id,
        total_complaints_submitted=total_submitted
    )


@router.post("/change-password", response_model=GenericMessageResponse)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows authenticated user to update their password securely."""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
        
    current_user.hashed_password = get_password_hash(request.new_password)
    # Revoke existing refresh tokens
    db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).update({"is_revoked": True})
    db.commit()

    send_password_changed_notification(current_user.email, current_user.full_name)

    return GenericMessageResponse(message="Password changed successfully.", success=True)


# --------------------------------------------------------------------------
# 6. Development / Testing Inspection Endpoint
# --------------------------------------------------------------------------

@router.get("/dev/sent-emails")
def get_sent_emails_dev():
    """
    Allows developers or automated testing to inspect recent email dispatches during development.
    Disabled or safe in all environments.
    """
    return {
        "count": len(get_dev_email_inbox()),
        "emails": get_dev_email_inbox()[-10:]
    }
