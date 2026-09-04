import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class DamageClass(str, enum.Enum):
    POTHOLE = "Pothole"
    LONGITUDINAL_CRACK = "Longitudinal Crack"
    TRANSVERSE_CRACK = "Transverse Crack"
    ALLIGATOR_CRACK = "Alligator Crack"
    SURFACE_DAMAGE = "Surface Damage"
    NO_DAMAGE = "No Clear Damage Detected"

class SeverityLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class AIResult(Base):
    __tablename__ = "ai_results"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(String(50), ForeignKey("complaints.id"), unique=True, nullable=False, index=True)
    
    primary_damage_type = Column(Enum(DamageClass), default=DamageClass.POTHOLE, nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    severity = Column(Enum(SeverityLevel), default=SeverityLevel.MEDIUM, nullable=False)
    
    # JSON-encoded array of all detected bounding boxes
    detections_json = Column(Text, nullable=False)
    
    annotated_image_url = Column(String(500), nullable=False)
    damage_count = Column(Integer, default=1)
    
    model_version = Column(String(100), default="YOLOv8n-RoadDamage-v1.0")
    processing_time_ms = Column(Float, default=120.0)
    detection_timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Disclaimer label stored in DB to guarantee proper representation
    disclaimer = Column(String(200), default="AI-Assisted Detection – Requires Authority Engineering Review")

    # Relationship
    complaint = relationship("Complaint", back_populates="ai_result")
