from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.engineer import Engineer, EngineerStatus
from app.models.authority import Authority, AuthorityType
from app.schemas.auth import LoginRequest, RegisterRequest, Token, ChangePasswordRequest
from app.schemas.user import UserResponse, UserProfileResponse
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user
from app.services.notification_service import create_notification
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

@router.post("/register", response_model=Token)
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new citizen or user account."""
    existing_user = db.query(User).filter(User.email == request.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    hashed_pwd = get_password_hash(request.password)
    user = User(
        email=request.email.lower(),
        hashed_password=hashed_pwd,
        full_name=request.full_name,
        phone=request.phone,
        role=request.role,
        district=request.district,
        state=request.state,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    authority_id = None
    engineer_id = None
    
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
        db.refresh(engineer)
        engineer_id = engineer.id
        authority_id = engineer.authority_id
    elif request.role == UserRole.AUTHORITY:
        if request.authority_id:
            authority_id = request.authority_id
        else:
            auth = resolve_authority_for_user(user, db)
            if auth:
                authority_id = auth.id

    # Create welcome notification
    create_notification(
        db=db,
        user_id=user.id,
        title="Welcome to RoadGuard AI!",
        message="Your account has been successfully created. You can now report road defects and track repairs in real-time.",
        notif_type=NotificationType.SUCCESS
    )

    # Generate JWT token
    extra_claims = {
        "email": user.email,
        "role": user.role.value,
        "authority_id": authority_id,
        "engineer_id": engineer_id,
    }
    access_token = create_access_token(subject=user.id, extra_claims=extra_claims)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        authority_id=authority_id,
        engineer_id=engineer_id
    )

@router.post("/login", response_model=Token)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates user with email and password, returning JWT token."""
    user = db.query(User).filter(User.email == request.email.lower()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )
        
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
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        authority_id=authority_id,
        engineer_id=engineer_id
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns profile details of currently authenticated user."""
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
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        authority_id=auth_id,
        authority_name=auth_name,
        engineer_id=eng_id,
        total_complaints_submitted=total_submitted
    )

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allows authenticated user to update their password securely."""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )
        
    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password changed successfully."}
