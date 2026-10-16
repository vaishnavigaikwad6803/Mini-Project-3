import logging
from typing import Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool
from app.config import settings

logger = logging.getLogger("roadguard.database")

# Configure database engine with connection pooling and timeouts
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 30},
        pool_pre_ping=True,
        echo=False
    )
else:
    # MySQL / MariaDB / PostgreSQL Production Pooling
    engine = create_engine(
        settings.DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        pool_timeout=30,
        pool_pre_ping=True,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI Dependency providing a transactional database session with rollback safety."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def check_db_connection() -> Tuple[bool, str]:
    """Tests the database connection by executing a lightweight query."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True, "Database connection is active and healthy."
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False, str(e)

def close_db_connection():
    """Gracefully closes all pool connections on application shutdown."""
    try:
        engine.dispose()
        logger.info("Database connection pool disposed gracefully.")
    except Exception as e:
        logger.error(f"Error closing database pool: {str(e)}")
