import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class RepairStage(str, enum.Enum):
    ASSIGNED = "Assigned"
    INSPECTION_PENDING = "Inspection Pending"
    INSPECTION_COMPLETED = "Inspection Completed"
    REPAIR_STARTED = "Repair Started"
    REPAIR_IN_PROGRESS = "Repair In Progress"
    REPAIR_COMPLETED = "Repair Completed"
    AUTHORITY_VERIFICATION = "Authority Verification"
    CLOSED = "Closed"

class Repair(Base):
    __tablename__ = "repairs"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), ForeignKey("complaints.id"), unique=True, nullable=False, index=True)
    engineer_id = Column(Integer, ForeignKey("engineers.id"), nullable=False, index=True)
    
    current_stage = Column(Enum(RepairStage), default=RepairStage.ASSIGNED, nullable=False, index=True)
    
    # Inspection phase
    inspection_remarks = Column(Text, nullable=True)
    inspection_date = Column(DateTime, nullable=True)
    inspection_image = Column(String(500), nullable=True)
    
    # Repair execution phase
    repair_start_date = Column(DateTime, nullable=True)
    repair_completion_date = Column(DateTime, nullable=True)
    completion_remarks = Column(Text, nullable=True)
    
    repair_before_image = Column(String(500), nullable=True)
    repair_after_image = Column(String(500), nullable=True)
    
    materials_used = Column(String(255), nullable=True)  # e.g., "Cold Bituminous Mix, Tack Coat, Aggregate base"
    estimated_cost = Column(Float, nullable=True)
    actual_cost = Column(Float, nullable=True)
    
    # Authority verification phase
    verified_by_authority_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verification_remarks = Column(Text, nullable=True)
    verification_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="repair")
    engineer = relationship("Engineer", back_populates="repairs")
    verified_by_authority = relationship("User", foreign_keys=[verified_by_authority_id])
