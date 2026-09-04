import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.complaint import Complaint, ComplaintStatus
from app.models.ai_result import AIResult
from app.schemas.ai_result import AIResultResponse
from app.auth.dependencies import get_current_user
from app.utils.file_storage import save_upload_image
from app.ai.detector import get_detector
from app.services.timeline_service import record_status_change

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Road Damage Detection"])

@router.post("/validate-image")
async def validate_captured_image(
    image: UploadFile = File(...)
):
    """
    STAGE 1: Road Image Validation
    Validates whether an image captured by citizen contains a valid road surface or road defect.
    Returns:
    {
        "road_validation_result": "VALID_ROAD_IMAGE" | "INVALID_NON_ROAD_IMAGE",
        "road_validation_confidence": float,
        "is_valid": bool,
        "reason": str,
        "error_message": str | None,
        "yolo_allowed": bool,
        "image_url": str
    }
    """
    abs_path, web_url = await save_upload_image(image, subfolder="temp_validation")
    detector = get_detector()
    validation = detector.validate_image(abs_path)
    logger.info(
        f"[AI API Debug] /ai/validate-image: Result={validation['road_validation_result']}, "
        f"Confidence={validation['road_validation_confidence']}, Allowed={validation['yolo_allowed']}"
    )
    return {
        **validation,
        "image_url": web_url
    }

@router.post("/detect-standalone")
async def detect_standalone_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    TWO-STAGE DETECTION:
    Runs Stage 1 Validation -> If Valid, runs Stage 2 YOLOv8 road damage detection.
    If Invalid -> Returns structured 400 rejection without running damage model.
    """
    abs_path, web_url = await save_upload_image(image, subfolder="complaints")
    detector = get_detector()
    try:
        result = detector.run_detection(abs_path)
        result["original_image_url"] = web_url
        return result
    except ValueError as e:
        val = detector.validate_image(abs_path)
        logger.warning(f"[AI API Debug] /ai/detect-standalone rejected: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=val.get("error_message") or str(e)
        )

@router.get("/results/{complaint_id}", response_model=AIResultResponse)
def get_complaint_ai_result(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns AI detection analysis for a given complaint ID."""
    ai_result = db.query(AIResult).filter(AIResult.complaint_id == complaint_id).first()
    if not ai_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AI analysis found for complaint '{complaint_id}'."
        )

    det_list = []
    try:
        det_list = json.loads(ai_result.detections_json)
    except Exception:
        det_list = []

    return AIResultResponse(
        id=ai_result.id,
        complaint_id=ai_result.complaint_id,
        primary_damage_type=ai_result.primary_damage_type,
        confidence_score=ai_result.confidence_score,
        severity=ai_result.severity,
        damage_count=ai_result.damage_count,
        detections=det_list,
        annotated_image_url=ai_result.annotated_image_url,
        model_version=ai_result.model_version,
        processing_time_ms=ai_result.processing_time_ms,
        detection_timestamp=ai_result.detection_timestamp,
        disclaimer=ai_result.disclaimer
    )
