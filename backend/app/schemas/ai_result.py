from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel
from app.models.ai_result import DamageClass, SeverityLevel

class DetectionBox(BaseModel):
    bbox: List[float]  # [x1, y1, x2, y2]
    class_name: str
    confidence: float
    area_percentage: float

class AIResultResponse(BaseModel):
    id: int
    complaint_id: str
    primary_damage_type: DamageClass
    confidence_score: float
    severity: SeverityLevel
    damage_count: int
    detections: List[Dict[str, Any]] = []
    annotated_image_url: str
    model_version: str
    processing_time_ms: float
    detection_timestamp: datetime
    disclaimer: str

    class Config:
        from_attributes = True

class AIDetectionTriggerRequest(BaseModel):
    complaint_id: str
