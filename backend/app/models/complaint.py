import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class RoadType(str, enum.Enum):
    NATIONAL_HIGHWAY = "National Highway"
    STATE_HIGHWAY = "State Highway"
    MUNICIPAL_ROAD = "Municipal/City Road"
    RURAL_ROAD = "Rural/Village Road"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "Submitted"
    AI_ANALYZED = "AI Analyzed"
    AUTHORITY_ASSIGNED = "Authority Assigned"
    UNDER_REVIEW = "Under Review"
    ENGINEER_ASSIGNED = "Engineer Assigned"
    INSPECTION_PENDING = "Inspection Pending"
    INSPECTION_COMPLETED = "Inspection Completed"
    REPAIR_STARTED = "Repair Started"
    REPAIR_IN_PROGRESS = "Repair In Progress"
    REPAIR_COMPLETED = "Repair Completed"
    AUTHORITY_VERIFICATION = "Authority Verification"
    CLOSED = "Closed"
    REJECTED = "Rejected"

class PriorityLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(50), primary_key=True, index=True)  # e.g., RGD-2026-0042
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    authority_id = Column(Integer, ForeignKey("authorities.id"), nullable=True, index=True)
    
    road_name = Column(String(200), nullable=False)
    road_type = Column(Enum(RoadType), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    landmark = Column(String(200), nullable=True)
    
    image_url = Column(String(500), nullable=True)
    
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUBMITTED, nullable=False, index=True)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    
    # Auto-routing notes or rejection reasons
    routing_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    authority = relationship("Authority", back_populates="complaints")
    ai_result = relationship("AIResult", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    repair = relationship("Repair", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="complaint", order_by="StatusHistory.timestamp.asc()", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="complaint", cascade="all, delete-orphan")
