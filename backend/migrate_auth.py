import sqlite3
from pathlib import Path
from app.database import engine, Base
import app.models # registers all models

def migrate():
    print("Beginning Authentication Schema Migration...")

    # 1. Connect directly to SQLite to check users columns
    db_path = Path(__file__).resolve().parent / "roadguard.db"
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    cur.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cur.fetchall()]
    print(f"Current columns in users: {cols}")

    if "is_verified" not in cols:
        print("Adding 'is_verified' column to 'users' table...")
        cur.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 0")
        conn.commit()
        print("Column 'is_verified' added successfully.")

    # Mark all existing demo/seeded accounts as verified so they can log in without friction
    print("Setting existing seed users to verified...")
    cur.execute("UPDATE users SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL")
    conn.commit()
    conn.close()

    # 2. Use SQLAlchemy Base to create new auth tables (email_verifications, password_resets, refresh_tokens, login_attempts)
    print("Creating new authentication tables via SQLAlchemy...")
    Base.metadata.create_all(bind=engine)

    # 3. Verify tables
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cur.fetchall()]
    print(f"All database tables now present: {tables}")
    conn.close()

    print("Authentication Schema Migration completed successfully!")

if __name__ == "__main__":
    migrate()
