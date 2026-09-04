import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "complaints").mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "annotated").mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "repairs").mkdir(parents=True, exist_ok=True)

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        PROJECT_NAME: str = "RoadGuard AI"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api"
        
        SECRET_KEY: str = os.getenv("SECRET_KEY", "roadguard-ai-secret-key-2026-secure-jwt-token-key")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
        
        DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/roadguard.db")
        
        YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", str(BASE_DIR.parent / "ai" / "models" / "yolov8n.pt"))
        AI_CONFIDENCE_THRESHOLD: float = 0.25
        AI_DEMO_FALLBACK: bool = True
        
        UPLOAD_DIR_PATH: str = str(UPLOAD_DIR)
        
        BACKEND_CORS_ORIGINS: list[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "*"
        ]

        class Config:
            case_sensitive = True
            env_file = ".env"

    settings = Settings()

except Exception:
    class FallbackSettings:
        PROJECT_NAME: str = "RoadGuard AI"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api"
        SECRET_KEY: str = os.getenv("SECRET_KEY", "roadguard-ai-secret-key-2026-secure-jwt-token-key")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/roadguard.db")
        YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", str(BASE_DIR.parent / "ai" / "models" / "yolov8n.pt"))
        AI_CONFIDENCE_THRESHOLD: float = 0.25
        AI_DEMO_FALLBACK: bool = True
        UPLOAD_DIR_PATH: str = str(UPLOAD_DIR)
        BACKEND_CORS_ORIGINS: list[str] = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "*"
        ]

    settings = FallbackSettings()
