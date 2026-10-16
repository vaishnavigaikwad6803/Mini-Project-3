import io
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.repair import Repair, RepairStage
from app.models.status_history import StatusHistory
from app.auth.security import create_access_token

client = TestClient(app)

def test_stage_photos():
    print("==================================================")
    print("Testing Engineer Click Photo Option for All Stages")
    print("==================================================")

    db = SessionLocal()
    engineer_user = db.query(User).filter(User.role == UserRole.ENGINEER).first()
    assert engineer_user, "Engineer user must exist in DB"
    engineer_token = create_access_token(str(engineer_user.id))
    headers = {"Authorization": f"Bearer {engineer_token}"}

    repair = db.query(Repair).first()
    assert repair, "At least one repair record must exist in DB"
    repair_id = repair.id
    complaint_id = repair.complaint_id

    from PIL import Image

    def make_test_image(color="blue"):
        img = Image.new("RGB", (120, 120), color=color)
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        return buf

    # 1. Test Stage Update WITH Clicked Photo (Inspection Completed)
    response = client.patch(
        f"/api/repairs/{repair_id}/stage",
        data={
            "current_stage": "Inspection Completed",
            "remarks": "On-site inspection completed with defect photos.",
            "materials_used": "Cold Mix Asphalt",
            "actual_cost": "12000"
        },
        files={"stage_image": ("inspection_photo.jpg", make_test_image("orange"), "image/jpeg")},
        headers=headers
    )
    assert response.status_code == 200, f"Stage update with photo failed: {response.text}"
    data = response.json()
    assert data["current_stage"] == "Inspection Completed"
    assert data["stage_image"] is not None
    assert "/uploads/repairs/" in data["stage_image"]
    assert data["inspection_image"] is not None
    print(f"✓ Stage 'Inspection Completed' updated with photo: {data['stage_image']}")

    # Check status history has the photo recorded
    sh = db.query(StatusHistory).filter(
        StatusHistory.complaint_id == complaint_id,
        StatusHistory.to_status == "Inspection Completed"
    ).order_by(StatusHistory.id.desc()).first()
    assert sh is not None
    assert sh.image_url is not None
    print(f"✓ Status History contains image_url audit proof: {sh.image_url}")
    # 2. Test Stage Update WITH Clicked Photo (Repair In Progress)
    response2 = client.patch(
        f"/api/repairs/{repair_id}/stage",
        data={
            "current_stage": "Repair In Progress",
            "remarks": "Bitumen layer compaction in progress.",
            "materials_used": "Hot Mix Asphalt + Bitumen Tack Coat",
            "actual_cost": "15000"
        },
        files={"stage_image": ("progress_layer.jpg", make_test_image("cyan"), "image/jpeg")},
        headers=headers
    )
    assert response2.status_code == 200, f"Stage update with progress photo failed: {response2.text}"
    data2 = response2.json()
    assert data2["current_stage"] == "Repair In Progress"
    assert data2["stage_image"] is not None
    print(f"✓ Stage 'Repair In Progress' updated with photo: {data2['stage_image']}")

    # 3. Test Stage Update WITHOUT Photo (JSON body fallback)
    response3 = client.patch(
        f"/api/repairs/{repair_id}/stage",
        json={
            "current_stage": "Repair Started",
            "remarks": "Surface excavation starting without new photo."
        },
        headers=headers
    )
    assert response3.status_code == 200, f"Stage update with JSON failed: {response3.text}"
    data3 = response3.json()
    assert data3["current_stage"] == "Repair Started"
    print("✓ Stage update without photo (JSON payload) works seamlessly")

    # 4. Check Complaint Details returns status_history with image_url
    details_res = client.get(f"/api/complaints/{complaint_id}")
    assert details_res.status_code == 200
    details = details_res.json()
    assert "status_history" in details
    has_photo_entry = any(h.get("image_url") for h in details["status_history"])
    assert has_photo_entry, "Expected at least one status history entry with image_url"
    print(f"✓ Complaint Details returned {len(details['status_history'])} timeline milestones with stage photos attached")

    db.close()
    print("\n==================================================")
    print("ALL STAGE PHOTO TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_stage_photos()
