import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from PIL import Image
from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def validate_image_file(file: UploadFile) -> str:
    """Validates extension and basic file characteristics, returns normalized extension."""
    filename = file.filename or ""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return ext

async def save_upload_image(file: UploadFile, subfolder: str = "complaints") -> tuple[str, str]:
    """
    Saves an uploaded image file to the designated local storage subfolder.
    Returns (absolute_file_path, relative_web_url).
    """
    ext = validate_image_file(file)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = Path(settings.UPLOAD_DIR_PATH) / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)
    
    destination_path = target_dir / unique_filename
    
    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size allowed is {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
        )
        
    with open(destination_path, "wb") as f:
        f.write(content)
        
    # Verify image integrity with Pillow
    try:
        with Image.open(destination_path) as img:
            img.verify()
    except Exception as e:
        if destination_path.exists():
            destination_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or invalid image file: {str(e)}"
        )
        
    web_url = f"/uploads/{subfolder}/{unique_filename}"
    return str(destination_path), web_url
