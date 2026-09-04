from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.status_history import StatusHistory
from app.models.complaint import Complaint, ComplaintStatus

def record_status_change(
    db: Session,
    complaint_id: str,
    to_status: str,
    from_status: Optional[str] = None,
    user_id: Optional[int] = None,
    role_name: Optional[str] = None,
    remarks: Optional[str] = None
) -> StatusHistory:
    """Appends an immutable audit log entry to the complaint lifecycle timeline."""
    history_entry = StatusHistory(
        complaint_id=complaint_id,
        from_status=from_status,
        to_status=to_status,
        changed_by_user_id=user_id,
        changed_by_role=role_name or "System",
        remarks=remarks,
        timestamp=datetime.utcnow()
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)
    return history_entry
