from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), ForeignKey("complaints.id"), nullable=False, index=True)
    
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    changed_by_role = Column(String(50), nullable=True)  # System, Citizen, Authority, Engineer, Admin
    
    remarks = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    complaint = relationship("Complaint", back_populates="status_history")
    changed_by_user = relationship("User", back_populates="status_changes")
