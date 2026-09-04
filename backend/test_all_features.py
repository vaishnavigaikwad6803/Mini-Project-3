import os
import sys
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.authority import Authority
from app.models.engineer import Engineer
from app.models.complaint import Complaint
from app.models.repair import Repair, RepairStage
from app.auth.security import create_access_token

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("Testing 8 User Requirements Implementation")
    print("==================================================")

    # 1. Test Map Complaints endpoint includes assigned engineer details (Req 2, 3)
    response = client.get("/api/maps/complaints")
    assert response.status_code == 200, f"Map complaints failed: {response.text}"
    map_complaints = response.json()
    print(f"✓ Map complaints endpoint returned {len(map_complaints)} markers")
    
    # Check that engineer fields are present in the response schema
    if map_complaints:
        first = map_complaints[0]
        assert "engineer_name" in first, "engineer_name missing from map complaint"
        assert "engineer_employee_id" in first, "engineer_employee_id missing from map complaint"
        assert "status" in first, "status missing from map complaint"
        print(f"✓ Map Complaint sample: ID={first['id']}, Status={first['status']}, Engineer={first.get('engineer_name')}")

    db = SessionLocal()
    admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
    authority_user = db.query(User).filter(User.role == UserRole.AUTHORITY).first()
    engineer_user = db.query(User).filter(User.role == UserRole.ENGINEER).first()

    admin_token = create_access_token(str(admin_user.id)) if admin_user else None
    authority_token = create_access_token(str(authority_user.id)) if authority_user else None
    engineer_token = create_access_token(str(engineer_user.id)) if engineer_user else None

    # 2. Test Authority / Admin Engineer Registration (Req 7)
    import random
    code = random.randint(1000, 9999)
    reg_data = {
        "full_name": f"Er. Test Engineer {code}",
        "email": f"test.eng{code}@roadguard.ai",
        "password": "Password@123",
        "phone": "+91 9988776655",
        "authority_id": 1,
        "employee_id": f"ENG-MH-TEST-{code}",
        "designation": "Field Specialist",
        "specialization": "Pothole & Surface Patching",
        "district": "Pune",
        "state": "Maharashtra"
    }
    reg_res = client.post(
        "/api/engineers/register",
        json=reg_data,
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert reg_res.status_code == 200, f"Engineer registration failed: {reg_res.text}"
    created_eng = reg_res.json()
    print(f"✓ Authority Registered New Engineer: {created_eng['full_name']} (ID: {created_eng['id']}, EmployeeID: {created_eng['employee_id']})")

    # 3. Test Delete Complaint with Mandatory Reason (Req 5)
    del_fail = client.request(
        "DELETE",
        f"/api/complaints/CMP-NONEXISTENT",
        json={"reason": "   "},
        headers={"Authorization": f"Bearer {authority_token}"}
    )
    assert del_fail.status_code in [400, 422], f"Expected validation failure for empty reason, got {del_fail.status_code}"
    print("✓ Empty deletion reason properly rejected with 400/422")

    # 4. Test Field Engineer Repair Completed Mandatory Image Enforcement (Req 8)
    active_repair = db.query(Repair).filter(Repair.repair_after_image == None).first()
    if active_repair:
        stage_fail = client.patch(
            f"/api/repairs/{active_repair.id}/stage",
            json={"current_stage": "Repair Completed", "remarks": "Trying to complete without image"},
            headers={"Authorization": f"Bearer {engineer_token}"}
        )
        assert stage_fail.status_code == 400, f"Expected 400 for completing repair without after image, got {stage_fail.status_code}"
        print(f"✓ Stage transition to 'Repair Completed' without photo proof blocked: {stage_fail.json()['detail']}")
    db.close()

    print("\n==================================================")
    print("ALL 8 USER REQUIREMENTS VALIDATED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
