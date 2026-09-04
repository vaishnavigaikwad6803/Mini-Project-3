from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.authority import Authority, AuthorityType
from app.models.engineer import Engineer
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.authority import (
    AuthorityCreate,
    AuthorityUpdate,
    AuthorityResponse,
    AuthorityStatsResponse
)
from app.schemas.complaint import ComplaintResponse
from app.api.complaints_router import enrich_complaint_response
from app.auth.dependencies import get_current_user, require_admin, require_authority

router = APIRouter(prefix="/authorities", tags=["Authorities"])

@router.get("", response_model=List[AuthorityResponse])
def get_authorities(
    authority_type: Optional[AuthorityType] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Lists registered road authorities with optional filters."""
    query = db.query(Authority).filter(Authority.is_active == True)
    if authority_type:
        query = query.filter(Authority.authority_type == authority_type)
    if state:
        query = query.filter(Authority.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Authority.district.ilike(f"%{district}%"))
    return query.all()

@router.post("", response_model=AuthorityResponse)
def create_authority(
    data: AuthorityCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a new road authority configuration."""
    existing = db.query(Authority).filter(Authority.code == data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authority with code '{data.code}' already exists."
        )

    auth = Authority(
        **data.dict(),
        created_by_admin_id=current_user.id
    )
    db.add(auth)
    db.commit()
    db.refresh(auth)
    return auth

@router.get("/{authority_id}", response_model=AuthorityResponse)
def get_authority_by_id(authority_id: int, db: Session = Depends(get_db)):
    """Returns details of a specific authority."""
    auth = db.query(Authority).filter(Authority.id == authority_id).first()
    if not auth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authority not found.")
    return auth

@router.put("/{authority_id}", response_model=AuthorityResponse)
def update_authority(
    authority_id: int,
    data: AuthorityUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin updates an authority record."""
    auth = db.query(Authority).filter(Authority.id == authority_id).first()
    if not auth:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authority not found.")

    for field, val in data.dict(exclude_unset=True).items():
        setattr(auth, field, val)

    db.commit()
    db.refresh(auth)
    return auth

@router.get("/{authority_id}/complaints", response_model=List[ComplaintResponse])
def get_authority_complaints(
    authority_id: int,
    status: Optional[ComplaintStatus] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all complaints assigned to a specific authority."""
    query = db.query(Complaint).filter(Complaint.authority_id == authority_id)
    if status:
        query = query.filter(Complaint.status == status)
    complaints = query.order_by(Complaint.created_at.desc()).all()
    return [enrich_complaint_response(c) for c in complaints]

@router.get("/{authority_id}/stats", response_model=AuthorityStatsResponse)
def get_authority_stats(
    authority_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns aggregated KPI stats for an authority dashboard."""
    base = db.query(Complaint).filter(Complaint.authority_id == authority_id)
    total = base.count()
    pending = base.filter(Complaint.status.in_([ComplaintStatus.SUBMITTED, ComplaintStatus.AI_ANALYZED])).count()
    under_review = base.filter(Complaint.status.in_([ComplaintStatus.AUTHORITY_ASSIGNED, ComplaintStatus.UNDER_REVIEW])).count()
    in_repair = base.filter(Complaint.status.in_([
        ComplaintStatus.ENGINEER_ASSIGNED,
        ComplaintStatus.INSPECTION_PENDING,
        ComplaintStatus.INSPECTION_COMPLETED,
        ComplaintStatus.REPAIR_STARTED,
        ComplaintStatus.REPAIR_IN_PROGRESS,
        ComplaintStatus.REPAIR_COMPLETED,
        ComplaintStatus.AUTHORITY_VERIFICATION
    ])).count()
    completed = base.filter(Complaint.status == ComplaintStatus.CLOSED).count()

    total_eng = db.query(Engineer).filter(Engineer.authority_id == authority_id).count()
    active_eng = db.query(Engineer).filter(
        Engineer.authority_id == authority_id,
        Engineer.status == "ACTIVE"
    ).count()

    return AuthorityStatsResponse(
        total_complaints=total,
        pending_complaints=pending,
        under_review_complaints=under_review,
        in_repair_complaints=in_repair,
        completed_complaints=completed,
        total_engineers=total_eng,
        active_engineers=active_eng
    )
