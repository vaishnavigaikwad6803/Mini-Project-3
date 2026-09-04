from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.notification import NotificationType

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    complaint_id: Optional[str] = None
    title: str
    message: str
    type: NotificationType
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationMarkReadRequest(BaseModel):
    notification_ids: Optional[list[int]] = None
    mark_all: bool = False
