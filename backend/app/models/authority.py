import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class AuthorityType(str, enum.Enum):
    NATIONAL_HIGHWAY = "National Highway Authority"
    STATE_HIGHWAY = "State Highway/PWD Authority"
    MUNICIPAL = "Municipal Authority"
    RURAL_ROAD = "Rural Road Authority"

class Authority(Base):
    __tablename__ = "authorities"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., NHAI-NORTH-01, PWD-MH-04
    name = Column(String(200), nullable=False)
    authority_type = Column(Enum(AuthorityType), nullable=False, index=True)
    road_type_coverage = Column(String(100), nullable=False)  # National Highway, State Highway, Municipal/City Road, Rural/Village Road
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    jurisdiction_area = Column(Text, nullable=True)  # E.g. "NH-48, NH-66 corridor Mumbai-Pune region"
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    created_by_admin = relationship("User", back_populates="managed_authorities", foreign_keys=[created_by_admin_id])
    engineers = relationship("Engineer", back_populates="authority", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="authority")
