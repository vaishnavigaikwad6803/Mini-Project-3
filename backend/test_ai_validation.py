import os
import sys
import numpy as np
import cv2
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.ai_result import DamageClass, SeverityLevel
from app.auth.security import create_access_token
from app.ai.detector import get_detector

client = TestClient(app)

TEMP_DIR = Path("test_temp_images")
TEMP_DIR.mkdir(exist_ok=True)

def create_synthetic_roof_image(filename="test_roof.jpg") -> str:
    """Creates synthetic ceiling/roof image with parallel beams on a white/light ceiling."""
    h, w = 600, 800
    img = np.full((h, w, 3), (235, 238, 240), dtype=np.uint8)
    # Draw ceiling beams / roof trusses
    for y in range(80, h, 90):
        cv2.rectangle(img, (0, y), (w, y + 25), (70, 75, 80), -1)
        cv2.line(img, (0, y), (w, y), (40, 45, 50), 2)
    # Vertical cross braces
    for x in range(100, w, 150):
        cv2.line(img, (x, 0), (x, h), (110, 115, 120), 4)
    path = str(TEMP_DIR / filename)
    cv2.imwrite(path, img)
    return path

def create_synthetic_indoor_wall(filename="test_wall.jpg") -> str:
    """Creates a featureless smooth painted indoor wall image."""
    h, w = 600, 800
    img = np.full((h, w, 3), (245, 245, 245), dtype=np.uint8)
    path = str(TEMP_DIR / filename)
    cv2.imwrite(path, img)
    return path

def create_synthetic_clean_road(filename="test_clean_road.jpg") -> str:
    """Creates a clean dark asphalt road surface without damage."""
    np.random.seed(42)
    h, w = 600, 800
    # Bitumen asphalt base
    img = np.full((h, w, 3), (60, 65, 68), dtype=np.uint8)
    # Natural aggregate noise
    noise = np.random.normal(0, 14, (h, w, 3)).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    # White road lane marking in center
    cv2.line(img, (w // 2, 0), (w // 2, h), (230, 230, 230), 10)
    path = str(TEMP_DIR / filename)
    cv2.imwrite(path, img)
    return path

def create_synthetic_damaged_road(filename="test_damaged_road.jpg") -> str:
    """Creates a valid road image containing a distinct dark pothole cavity."""
    np.random.seed(42)
    h, w = 600, 800
    img = np.full((h, w, 3), (70, 75, 78), dtype=np.uint8)
    noise = np.random.normal(0, 10, (h, w, 3)).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # Draw significant dark pothole depression
    cv2.ellipse(img, (400, 360), (120, 80), 0, 0, 360, (20, 22, 24), -1)
    cv2.ellipse(img, (400, 360), (120, 80), 0, 0, 360, (140, 145, 150), 3)
    cv2.circle(img, (380, 350), 40, (12, 14, 15), -1)
    
    path = str(TEMP_DIR / filename)
    cv2.imwrite(path, img)
    return path

def run_all_tests():
    print("==========================================================")
    print("RoadGuard AI Two-Stage Pipeline & GPS Validation Tests")
    print("==========================================================")
    
    detector = get_detector()

    # ---------------------------------------------------------
    # TEST 1: NON-ROAD IMAGE VALIDATION (Roof / Ceiling)
    # ---------------------------------------------------------
    print("\n--- Running TEST 1: Non-Road Image Rejection (Roof / Ceiling) ---")
    roof_path = create_synthetic_roof_image()
    val_roof = detector.validate_image(roof_path)
    
    print(f"Stage 1 Validation Result:     {val_roof['road_validation_result']}")
    print(f"Stage 1 Validation Confidence: {val_roof['road_validation_confidence']}")
    print(f"Stage 1 YOLO Allowed:          {val_roof['yolo_allowed']}")
    print(f"Stage 1 Reason:                {val_roof['reason']}")
    print(f"Stage 1 Error Message:\n{val_roof['error_message']}")

    assert val_roof["road_validation_result"] == "INVALID_NON_ROAD_IMAGE", "Expected INVALID_NON_ROAD_IMAGE for roof"
    assert val_roof["is_valid"] is False, "Expected is_valid == False for roof"
    assert val_roof["yolo_allowed"] is False, "Expected yolo_allowed == False for roof"
    assert "Invalid Image" in val_roof["error_message"], "Expected 'Invalid Image' in error message"
    assert "This image does not appear to contain a road" in val_roof["error_message"], "Expected prompt standard error message"

    # Verify run_detection throws ValueError and DOES NOT run YOLO / create fake defects
    try:
        detector.run_detection(roof_path)
        assert False, "run_detection should have raised ValueError for non-road image"
    except ValueError as e:
        print(f"✓ run_detection properly rejected roof image: {e}")

    # Test API endpoint /api/ai/validate-image
    with open(roof_path, "rb") as f:
        resp = client.post("/api/ai/validate-image", files={"image": ("roof.jpg", f, "image/jpeg")})
    assert resp.status_code == 200, f"Validate API failed: {resp.text}"
    api_val = resp.json()
    assert api_val["road_validation_result"] == "INVALID_NON_ROAD_IMAGE"
    assert api_val["is_valid"] is False
    print("✓ /api/ai/validate-image returned expected INVALID_NON_ROAD_IMAGE payload")

    # Test API endpoint /api/ai/detect-standalone
    db = SessionLocal()
    citizen_user = db.query(User).filter(User.role == UserRole.CITIZEN).first()
    token = create_access_token(str(citizen_user.id)) if citizen_user else None
    db.close()

    with open(roof_path, "rb") as f:
        resp_detect = client.post(
            "/api/ai/detect-standalone",
            files={"image": ("roof.jpg", f, "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"}
        )
    assert resp_detect.status_code == 400, f"Expected 400 for roof detect, got {resp_detect.status_code}"
    print(f"✓ /api/ai/detect-standalone rejected non-road with 400: {resp_detect.json()['detail']}")

    # Test complaint submission rejection for roof image
    with open(roof_path, "rb") as f:
        resp_sub = client.post(
            "/api/complaints",
            data={
                "road_name": "Village Center Road",
                "road_type": "Rural/Village Road",
                "latitude": 16.8234,
                "longitude": 74.1234,
                "district": "Kolhapur",
                "state": "Maharashtra",
                "damage_type": "Pothole"
            },
            files={"road_image": ("roof.jpg", f, "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"}
        )
    assert resp_sub.status_code == 400, f"Expected 400 for roof complaint submission, got {resp_sub.status_code}"
    print("✓ Complaint submission with roof image rejected with HTTP 400")

    # ---------------------------------------------------------
    # TEST 2: VALID ROAD IMAGE WITHOUT DAMAGE (Clean Road)
    # ---------------------------------------------------------
    print("\n--- Running TEST 2: Valid Road Without Damage (Clean Road) ---")
    clean_road_path = create_synthetic_clean_road()
    val_clean = detector.validate_image(clean_road_path)

    print(f"Stage 1 Validation Result:     {val_clean['road_validation_result']}")
    print(f"Stage 1 Validation Confidence: {val_clean['road_validation_confidence']}")
    print(f"Stage 1 YOLO Allowed:          {val_clean['yolo_allowed']}")

    assert val_clean["road_validation_result"] == "VALID_ROAD_IMAGE", "Expected VALID_ROAD_IMAGE for clean road"
    assert val_clean["is_valid"] is True
    assert val_clean["yolo_allowed"] is True

    # Run detection on clean road
    res_clean = detector.run_detection(clean_road_path)
    print(f"Stage 2 Primary Damage Type:   {res_clean['primary_damage_type'].value}")
    print(f"Stage 2 Damage Count:          {res_clean['damage_count']}")
    print(f"Stage 2 Severity:              {res_clean['severity'].value}")
    print(f"Stage 2 Disclaimer:            {res_clean['disclaimer']}")

    assert res_clean["primary_damage_type"] == DamageClass.NO_DAMAGE, "Expected NO_DAMAGE for clean road"
    assert res_clean["damage_count"] == 0, "Expected 0 defects for clean road (No fake potholes!)"
    assert len(res_clean["detections"]) == 0, "Expected empty detections list"
    assert res_clean["severity"] == SeverityLevel.LOW, "Expected LOW severity for clean road"
    print("✓ Clean road correctly identified with 0 defects and NO fake potholes")

    # ---------------------------------------------------------
    # TEST 3: VALID DAMAGED ROAD (Pothole Detected)
    # ---------------------------------------------------------
    print("\n--- Running TEST 3: Valid Damaged Road (Pothole Detected) ---")
    damaged_road_path = create_synthetic_damaged_road()
    val_damaged = detector.validate_image(damaged_road_path)

    assert val_damaged["road_validation_result"] == "VALID_ROAD_IMAGE"
    assert val_damaged["is_valid"] is True
    assert val_damaged["yolo_allowed"] is True

    res_damaged = detector.run_detection(damaged_road_path)
    print(f"Stage 2 Primary Damage Type:   {res_damaged['primary_damage_type'].value}")
    print(f"Stage 2 Damage Count:          {res_damaged['damage_count']}")
    print(f"Stage 2 Severity:              {res_damaged['severity'].value}")
    print(f"Stage 2 Detections:            {res_damaged['detections']}")

    assert res_damaged["damage_count"] > 0, "Expected at least 1 defect detected"
    assert res_damaged["primary_damage_type"] == DamageClass.POTHOLE, "Expected Pothole detection"
    assert len(res_damaged["detections"]) > 0
    assert "bbox" in res_damaged["detections"][0]
    print("✓ Damaged road correctly validated and defect bounding boxes detected")

    # ---------------------------------------------------------
    # TEST 4: GPS COORDINATES & COMPLAINT SUBMISSION
    # ---------------------------------------------------------
    print("\n--- Running TEST 4: GPS Location & Database Consistency ---")
    # Simulate submission at Alave village coordinates (e.g. Lat 16.7821, Lng 74.0892 in Kolhapur)
    alave_lat = 16.782145
    alave_lng = 74.089234
    
    with open(damaged_road_path, "rb") as f:
        resp_alave = client.post(
            "/api/complaints",
            data={
                "road_name": "Alave Village Road",
                "road_type": "Rural/Village Road",
                "latitude": alave_lat,
                "longitude": alave_lng,
                "district": "Kolhapur",
                "state": "Maharashtra",
                "damage_type": "Pothole",
                "description": "Deep pothole near Alave Gram Panchayat"
            },
            files={"road_image": ("alave_road.jpg", f, "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"}
        )
    assert resp_alave.status_code == 200, f"Complaint submission failed: {resp_alave.text}"
    comp_data = resp_alave.json()
    
    print(f"✓ Created Complaint ID: {comp_data['id']}")
    print(f"✓ Saved Latitude:      {comp_data['latitude']}")
    print(f"✓ Saved Longitude:     {comp_data['longitude']}")
    print(f"✓ Road Name:           {comp_data['road_name']}")
    print(f"✓ District:            {comp_data['district']}")
    print(f"✓ Primary Damage Type: {comp_data['primary_damage_type']}")
    print(f"✓ Status:              {comp_data['status']}")

    assert abs(comp_data["latitude"] - alave_lat) < 1e-5, "Latitude must match exact submitted coordinates"
    assert abs(comp_data["longitude"] - alave_lng) < 1e-5, "Longitude must match exact submitted coordinates"
    assert comp_data["district"] == "Kolhapur"
    assert comp_data["road_name"] == "Alave Village Road"

    print("\n==========================================================")
    print("ALL AI VALIDATION & GPS DATA FLOW TESTS PASSED!")
    print("==========================================================")

if __name__ == "__main__":
    run_all_tests()
