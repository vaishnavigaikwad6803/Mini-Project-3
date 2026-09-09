# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.admin import AdminAnalyticsData
from app.auth.dependencies import require_admin
from app.services.analytics_service import get_admin_dashboard_metrics

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/dashboard", response_model=AdminAnalyticsData)
def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns full analytics dashboard data for Admin:
    - KPIs (Total users, complaints, active repairs, authorities, engineers)
    - Road Type distribution
    - Damage Type distribution
    - District distribution
    - Monthly trends
    - Authority performance breakdown
    """
    metrics = get_admin_dashboard_metrics(db)
    return metrics
