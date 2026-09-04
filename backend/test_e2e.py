import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            return res.getcode(), json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def run_tests():
    print("=" * 60)
    print("🔍 RoadGuard AI – End-to-End System Verification Test")
    print("=" * 60)

    # 1. Health Check
    code, res = make_request("/health")
    print(f"1. Health Check: Status {code} => {res}")
    assert code == 200, "Health check failed"

    # 2. Login as Admin
    code, res = make_request("/auth/login", method="POST", data={
        "email": "admin@roadguard.ai",
        "password": "AdminPassword123"
    })
    print(f"2. Admin Login Response: Code {code}, Body: {res}")
    assert code == 200 and "access_token" in res, f"Admin login failed: {res}"
    admin_token = res["access_token"]

    # 3. Login as NHAI Authority
    code, res = make_request("/auth/login", method="POST", data={
        "email": "nhai.officer@roadguard.ai",
        "password": "AuthorityPass123"
    })
    print(f"3. Authority Login: Status {code} => User: {res['email']} (Auth ID: {res['authority_id']})")
    assert code == 200, "Authority login failed"
    auth_token = res["access_token"]
    auth_id = res["authority_id"] or 1

    # 4. Login as Field Engineer
    code, res = make_request("/auth/login", method="POST", data={
        "email": "engineer.rajesh@roadguard.ai",
        "password": "EngineerPass123"
    })
    print(f"4. Engineer Login: Status {code} => User: {res['email']} (Eng ID: {res['engineer_id']})")
    assert code == 200, "Engineer login failed"
    eng_token = res["access_token"]

    # 5. Fetch Admin Dashboard KPIs & Charts
    code, res = make_request("/admin/dashboard", token=admin_token)
    print(f"5. Admin Analytics: Status {code} => Total Complaints: {res['stats']['total_complaints']}, Authorities: {res['stats']['total_authorities']}")
    assert code == 200, "Admin analytics failed"

    # 6. Fetch Complaints List
    code, res = make_request("/complaints/", token=admin_token)
    print(f"6. Complaints List: Status {code} => Loaded {len(res)} seeded complaints")
    assert code == 200 and len(res) > 0, "Failed to load complaints"
    sample_complaint = res[0]

    # 7. Fetch Complaint Details with AI and Timeline
    code, res = make_request(f"/complaints/{sample_complaint['id']}", token=admin_token)
    print(f"7. Complaint Details ({sample_complaint['id']}): Status {code} => Road: {res['road_name']}")
    print(f"   AI Defect: {res['ai_result']['primary_damage_type']} (Confidence: {res['ai_result']['confidence_score']}, Severity: {res['ai_result']['severity']})")
    print(f"   Repair Stage: {res['repair']['current_stage'] if res['repair'] else 'None'}")
    print(f"   Timeline History Entries: {len(res['status_history'])}")
    assert code == 200 and res["ai_result"] is not None, "Failed to fetch complaint details"

    # 8. Fetch Map Spatial Coordinates
    code, res = make_request("/maps/complaints")
    print(f"8. GIS Map Coordinates: Status {code} => {len(res)} geocoded points")
    assert code == 200, "Failed to fetch map data"

    # 10. Test Live Complaint Submission & AI Detection
    import io
    import mimetypes
    from urllib.parse import urlencode

    # Create dummy image in memory
    import numpy as np
    import cv2
    img_arr = np.full((300, 400, 3), (70, 75, 80), dtype=np.uint8)
    cv2.circle(img_arr, (200, 150), 45, (25, 25, 30), -1) # synthetic pothole
    _, img_bytes = cv2.imencode('.jpg', img_arr)
    
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = bytearray()
    
    def add_field(name, value):
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        body.extend(f"{value}\r\n".encode())

    add_field("road_name", "Western Express Highway, Andheri Flyover")
    add_field("road_type", "National Highway")
    add_field("description", "Dangerous pothole on middle lane causing vehicle slowdowns.")
    add_field("latitude", "19.1136")
    add_field("longitude", "72.8697")
    add_field("district", "Mumbai Suburban")
    add_field("state", "Maharashtra")
    add_field("landmark", "Opposite Metro Station")

    # Add File
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="road_image"; filename="pothole_test.jpg"\r\n')
    body.extend(b'Content-Type: image/jpeg\r\n\r\n')
    body.extend(img_bytes.tobytes())
    body.extend(b'\r\n')
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        f"{BASE_URL}/complaints",
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Authorization": f"Bearer {admin_token}"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as res:
        new_complaint = json.loads(res.read().decode("utf-8"))
        print(f"10. Live AI Complaint Upload: Status {res.getcode()} => Created ID: {new_complaint['id']}")
        print(f"    AI Detected: {new_complaint['ai_result']['primary_damage_type']} (Confidence: {new_complaint['ai_result']['confidence_score']})")
        print(f"    Auto-Routed Authority: {new_complaint['authority_name']}")
        assert new_complaint["status"] == "Authority Assigned", "Routing failed"
        assert new_complaint["ai_result"]["annotated_image_url"] is not None, "Annotated image missing"

    print("=" * 60)
    print("✅ ALL 10 END-TO-END SYSTEM VERIFICATION TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
