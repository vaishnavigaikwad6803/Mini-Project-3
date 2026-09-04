import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EngineerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    INACTIVE = "INACTIVE"

class Engineer(Base):
    __tablename__ = "engineers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    authority_id = Column(Integer, ForeignKey("authorities.id"), nullable=False, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g., ENG-NHAI-101
    designation = Column(String(100), default="Junior Road Maintenance Engineer")
    specialization = Column(String(150), default="Bituminous Pavement & Surface Repairs")
    active_workload = Column(Integer, default=0)  # Number of active repairs in progress
    status = Column(Enum(EngineerStatus), default=EngineerStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="engineer_profile")
    authority = relationship("Authority", back_populates="engineers")
    repairs = relationship("Repair", back_populates="engineer")
