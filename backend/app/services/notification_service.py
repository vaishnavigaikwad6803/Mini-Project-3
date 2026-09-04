from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    complaint_id: Optional[str] = None,
    notif_type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None
) -> Notification:
    """Creates and persists an in-app notification for a specific user."""
    notif = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        title=title,
        message=message,
        type=notif_type,
        action_url=action_url or (f"/complaints/{complaint_id}" if complaint_id else None)
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def notify_authority_officers(
    db: Session,
    authority_id: int,
    title: str,
    message: str,
    complaint_id: Optional[str] = None
):
    """Notifies all authority officers associated with a specific authority."""
    # Find authority officers (users with role AUTHORITY in the district or general)
    officers = db.query(User).filter(
        User.role.in_([UserRole.AUTHORITY, UserRole.ADMIN]),
        User.is_active == True
    ).all()
    
    for officer in officers:
        create_notification(
            db=db,
            user_id=officer.id,
            title=title,
            message=message,
            complaint_id=complaint_id,
            notif_type=NotificationType.WARNING,
            action_url=f"/complaints/{complaint_id}"
        )
