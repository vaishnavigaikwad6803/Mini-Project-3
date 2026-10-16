import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.database import engine, SessionLocal, check_db_connection
from app.models.user import User, UserRole
from app.models.authority import Authority, AuthorityType
from app.models.complaint import Complaint, ComplaintStatus, RoadType, PriorityLevel
from app.models.ai_result import AIResult, DamageClass, SeverityLevel
from app.models.repair import Repair, RepairStage
from app.models.notification import Notification, NotificationType

client = TestClient(app)

EXPECTED_TABLES = [
    "users",
    "authorities",
    "engineers",
    "complaints",
    "ai_results",
    "repairs",
    "status_history",
    "notifications",
    "email_verifications",
    "password_resets",
    "refresh_tokens",
    "login_attempts",
]

def run_tests():
    print("=" * 75)
    print("🔍 RoadGuard AI - Comprehensive Database Integration Verification")
    print("=" * 75)

    # 1. Test Low-Level Connection Check
    print("\n--- 1. Testing Low-Level Database Connection & Pooling ---")
    connected, msg = check_db_connection()
    assert connected, f"Low-level database connection failed: {msg}"
    print(f"✓ Low-level DB ping passed: {msg}")
    print(f"✓ Database dialect: {engine.dialect.name}")

    with engine.connect() as conn:
        if engine.dialect.name == "sqlite":
            res = conn.execute(text("SELECT sqlite_version()")).scalar()
            print(f"✓ SQLite version: {res}")
        else:
            res = conn.execute(text("SELECT VERSION()")).scalar()
            print(f"✓ Database version: {res}")

    # 2. Test All 12 Tables in Schema
    print("\n--- 2. Verifying All 12 Tables in Database Schema ---")
    with engine.connect() as conn:
        if engine.dialect.name == "sqlite":
            query = text("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in conn.execute(query).fetchall()]
        else:
            query = text("SHOW TABLES")
            tables = [row[0] for row in conn.execute(query).fetchall()]

    print(f"Discovered {len(tables)} tables: {sorted(tables)}")
    for tbl in EXPECTED_TABLES:
        assert tbl in tables, f"Expected table '{tbl}' not found in database!"
        print(f"  ✓ Table verified: {tbl}")

    # 3. Test HTTP /api/health with Database Probe
    print("\n--- 3. Testing API Health Probe Endpoint ---")
    health_res = client.get("/api/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    health_data = health_res.json()
    assert health_data["status"] == "healthy", f"Status must be healthy: {health_data}"
    assert health_data["database"]["status"] == "connected", f"DB must be connected: {health_data}"
    print(f"✓ /api/health returned: status={health_data['status']}, database={health_data['database']['dialect']} ({health_data['database']['status']})")

    # 4. Test CRUD Operations in Database Transaction
    print("\n--- 4. Testing End-to-End Database CRUD Operations ---")
    db = SessionLocal()

    # Create test authority
    test_auth_code = "TEST_DB_AUTH_01"
    existing_auth = db.query(Authority).filter(Authority.code == test_auth_code).first()
    if existing_auth:
        db.delete(existing_auth)
        db.commit()

    test_auth = Authority(
        code=test_auth_code,
        name="Test Verification Authority",
        authority_type=AuthorityType.MUNICIPAL,
        road_type_coverage="Municipal/City Road",
        state="Maharashtra",
        district="Pune",
        jurisdiction_area="Pune City Central",
        contact_email="test.auth@roadguard.ai",
        contact_phone="+91 9988776600",
        is_active=True
    )
    db.add(test_auth)
    db.commit()
    db.refresh(test_auth)
    assert test_auth.id is not None, "Failed to create authority"
    print(f"✓ CREATE: Added test authority (ID: {test_auth.id}, Code: {test_auth.code})")

    # Read test authority
    fetched_auth = db.query(Authority).filter(Authority.id == test_auth.id).first()
    assert fetched_auth is not None
    assert fetched_auth.name == "Test Verification Authority"
    print(f"✓ READ: Successfully retrieved authority by primary key ID={fetched_auth.id}")

    # Update test authority
    fetched_auth.jurisdiction_area = "Updated Pune East Zone"
    db.commit()
    db.refresh(fetched_auth)
    assert fetched_auth.jurisdiction_area == "Updated Pune East Zone"
    print("✓ UPDATE: Successfully updated authority record in database")

    # Delete test authority
    db.delete(fetched_auth)
    db.commit()
    deleted_check = db.query(Authority).filter(Authority.id == test_auth.id).first()
    assert deleted_check is None
    print("✓ DELETE: Successfully deleted test authority and confirmed absence")

    # 5. Test Data Persistence & Foreign Key Integrity
    print("\n--- 5. Testing Foreign Key Relationships & Data Integrity ---")
    user = db.query(User).filter(User.role == UserRole.CITIZEN).first()
    assert user is not None, "Citizen user required for relationship test"

    auth = db.query(Authority).first()
    assert auth is not None, "Authority required for relationship test"

    # Create complaint linked to user and authority
    test_comp_id = "RGD-TEST-DB-001"
    existing_comp = db.query(Complaint).filter(Complaint.id == test_comp_id).first()
    if existing_comp:
        db.delete(existing_comp)
        db.commit()

    test_comp = Complaint(
        id=test_comp_id,
        citizen_id=user.id,
        authority_id=auth.id,
        road_name="Sinhagad Road",
        road_type=RoadType.MUNICIPAL_ROAD,
        description="Pothole near bridge",
        latitude=18.5204,
        longitude=73.8567,
        district="Pune",
        state="Maharashtra",
        status=ComplaintStatus.SUBMITTED,
        priority=PriorityLevel.HIGH,
        image_url="complaints/test.jpg"
    )
    db.add(test_comp)
    db.commit()
    db.refresh(test_comp)

    # Add child AI result
    ai_res = AIResult(
        complaint_id=test_comp.id,
        primary_damage_type=DamageClass.POTHOLE,
        confidence_score=0.92,
        severity=SeverityLevel.HIGH,
        damage_count=1,
        annotated_image_url="complaints/test_annotated.jpg",
        detections_json="[]"
    )
    db.add(ai_res)
    db.commit()

    # Query with relationship joins
    queried_comp = db.query(Complaint).filter(Complaint.id == test_comp_id).first()
    assert queried_comp is not None
    assert queried_comp.citizen.id == user.id, "Citizen relationship failed"
    assert queried_comp.authority.id == auth.id, "Authority relationship failed"
    assert queried_comp.ai_result is not None, "AI result child relationship failed"
    print(f"✓ RELATIONSHIPS: Complaint -> Citizen ({queried_comp.citizen.full_name})")
    print(f"✓ RELATIONSHIPS: Complaint -> Authority ({queried_comp.authority.name})")
    print(f"✓ RELATIONSHIPS: Complaint -> AI Result ({queried_comp.ai_result.primary_damage_type}, {queried_comp.ai_result.confidence_score})")

    # Clean up test complaint
    db.delete(queried_comp)
    db.commit()
    print("✓ CASCADE/CLEANUP: Cleaned up test complaint record")

    db.close()

    print("\n" + "=" * 75)
    print("🎉 ALL DATABASE INTEGRATION & CONNECTIVITY TESTS PASSED PERFECTLY!")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
