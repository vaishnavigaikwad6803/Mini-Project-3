import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "complaints").mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "annotated").mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "repairs").mkdir(parents=True, exist_ok=True)

def build_database_url() -> str:
    """Builds and returns database connection string supporting SQLite and MySQL seamlessly."""
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url and explicit_url.strip():
        return explicit_url.strip()
    
    db_type = os.getenv("DB_TYPE", "sqlite").lower()
    if db_type in ("mysql", "mariadb"):
        user = os.getenv("DB_USER", "root")
        pwd = os.getenv("DB_PASSWORD", "")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "3306")
        name = os.getenv("DB_NAME", "roadguard")
        auth_part = f"{user}:{pwd}@" if pwd else f"{user}@"
        return f"mysql+pymysql://{auth_part}{host}:{port}/{name}?charset=utf8mb4"

    return f"sqlite:///{BASE_DIR}/roadguard.db"

try:
    from pydantic_settings import BaseSettings

    class Settings(BaseSettings):
        PROJECT_NAME: str = "RoadGuard AI"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api"
        
        SECRET_KEY: str = os.getenv("SECRET_KEY", "roadguard-ai-secret-key-2026-secure-jwt-token-key")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
        REFRESH_TOKEN_EXPIRE_DAYS: int = 30    # 30 days
        
        OTP_EXPIRE_MINUTES: int = 5
        PASSWORD_RESET_EXPIRE_MINUTES: int = 15
        RESEND_COOLDOWN_SECONDS: int = 60
        MAX_OTP_ATTEMPTS: int = 5
        MAX_LOGIN_ATTEMPTS: int = 5
        LOGIN_LOCKOUT_MINUTES: int = 15

        # SMTP & Email Delivery Configuration
        SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
        SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
        SMTP_USER: str = os.getenv("SMTP_USER", "")
        SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
        SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "no-reply@roadguard.ai")
        SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "RoadGuard AI")
        SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
        SMTP_SSL: bool = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes")
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
        EMAIL_SERVICE_MODE: str = os.getenv("EMAIL_SERVICE_MODE", "smtp")
        
        # Database Credentials & URL
        DB_TYPE: str = os.getenv("DB_TYPE", "sqlite")
        DB_HOST: str = os.getenv("DB_HOST", "localhost")
        DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
        DB_NAME: str = os.getenv("DB_NAME", "roadguard")
        DB_USER: str = os.getenv("DB_USER", "root")
        DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
        DATABASE_URL: str = build_database_url()
        
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
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
        REFRESH_TOKEN_EXPIRE_DAYS: int = 30
        OTP_EXPIRE_MINUTES: int = 5
        PASSWORD_RESET_EXPIRE_MINUTES: int = 15
        RESEND_COOLDOWN_SECONDS: int = 60
        MAX_OTP_ATTEMPTS: int = 5
        MAX_LOGIN_ATTEMPTS: int = 5
        LOGIN_LOCKOUT_MINUTES: int = 15

        SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
        SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
        SMTP_USER: str = os.getenv("SMTP_USER", "")
        SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
        SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "no-reply@roadguard.ai")
        SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "RoadGuard AI")
        SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
        SMTP_SSL: bool = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes")
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
        EMAIL_SERVICE_MODE: str = os.getenv("EMAIL_SERVICE_MODE", "smtp")

        DB_TYPE: str = os.getenv("DB_TYPE", "sqlite")
        DB_HOST: str = os.getenv("DB_HOST", "localhost")
        DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
        DB_NAME: str = os.getenv("DB_NAME", "roadguard")
        DB_USER: str = os.getenv("DB_USER", "root")
        DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
        DATABASE_URL: str = build_database_url()

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
