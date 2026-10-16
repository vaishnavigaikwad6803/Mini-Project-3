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

def ensure_schema_migrations():
    """Ensures schema changes and newly added columns exist across all teammate environments."""
    from sqlalchemy import inspect
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        with engine.connect() as conn:
            # 1. Ensure deadline column in complaints table
            if "complaints" in existing_tables:
                comp_cols = [c["name"] for c in inspector.get_columns("complaints")]
                if "deadline" not in comp_cols:
                    conn.execute(text("ALTER TABLE complaints ADD COLUMN deadline DATETIME"))
                    conn.commit()
                    logger.info("Auto-migrated: Added 'deadline' column to complaints table.")

            # 2. Ensure deadline column in repairs table
            if "repairs" in existing_tables:
                repair_cols = [c["name"] for c in inspector.get_columns("repairs")]
                if "deadline" not in repair_cols:
                    conn.execute(text("ALTER TABLE repairs ADD COLUMN deadline DATETIME"))
                    conn.commit()
                    logger.info("Auto-migrated: Added 'deadline' column to repairs table.")

            # 3. Ensure is_verified column in users table
            if "users" in existing_tables:
                user_cols = [c["name"] for c in inspector.get_columns("users")]
                if "is_verified" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1"))
                    conn.commit()
                    logger.info("Auto-migrated: Added 'is_verified' column to users table.")

    except Exception as e:
        logger.warning(f"Schema auto-migration notice: {str(e)}")

