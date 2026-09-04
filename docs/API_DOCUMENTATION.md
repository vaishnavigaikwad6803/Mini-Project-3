# RoadGuard AI – REST API Specification

Base URL: `http://localhost:8000/api`

---

## 1. Authentication Endpoints

### `POST /auth/register`
- **Description**: Registers a new citizen user.
- **Request Body**:
  ```json
  {
    "email": "citizen@example.com",
    "password": "SecurePassword123",
    "full_name": "Vaishnavi Patil",
    "phone": "+91 9876543210",
    "district": "Mumbai Suburban",
    "state": "Maharashtra"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "id": 5,
    "email": "citizen@example.com",
    "full_name": "Vaishnavi Patil",
    "role": "CITIZEN",
    "district": "Mumbai Suburban",
    "state": "Maharashtra",
    "is_active": true
  }
  ```

### `POST /auth/login`
- **Description**: Authenticates user and returns JWT bearer token.
- **Request Body**:
  ```json
  {
    "email": "admin@roadguard.ai",
    "password": "AdminPassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "admin@roadguard.ai",
      "full_name": "System Administrator",
      "role": "ADMIN"
    }
  }
  ```

---

## 2. Complaint Endpoints

### `POST /complaints/`
- **Description**: Multipart form submission of a road damage report with automatic YOLOv8 inference & authority routing.
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Form Data**:
  - `image`: File (Binary image)
  - `road_name`: `"Eastern Express Highway, Ghatkopar"`
  - `road_type`: `"National Highway"`
  - `description`: `"Large deep pothole on left lane"`
  - `latitude`: `19.0860`
  - `longitude`: `72.9080`
  - `district`: `"Mumbai Suburban"`
  - `state`: `"Maharashtra"`
  - `landmark`: `"Near Ramabai Colony flyover"`
- **Response `201 Created`**:
  ```json
  {
    "id": "RGD-2026-1006",
    "road_name": "Eastern Express Highway, Ghatkopar",
    "road_type": "National Highway",
    "status": "Authority Assigned",
    "priority": "High",
    "authority_name": "National Highways Authority of India (NHAI RO-Mumbai)",
    "ai_result": {
      "primary_damage_type": "Pothole",
      "confidence_score": 0.94,
      "severity": "High",
      "damage_count": 2,
      "annotated_image_url": "/uploads/annotated/RGD-2026-1006_ai.jpg",
      "disclaimer": "AI-Assisted Detection. Final verification by road authority engineers required."
    }
  }
  ```

### `GET /complaints/{id}`
- **Description**: Fetches complete detail view including AI result, timeline history, and repair progress.

---

## 3. Authority & Engineer Operations

### `POST /engineers/assign`
- **Description**: Assigns a field engineer to a complaint.
- **Request Body**:
  ```json
  {
    "complaint_id": "RGD-2026-1001",
    "engineer_id": 1,
    "remarks": "Dispatch for emergency patch repair."
  }
  ```

### `PATCH /repairs/{id}/stage`
- **Description**: Field engineer updates the progressive stage of maintenance.
- **Request Body**:
  ```json
  {
    "current_stage": "Repair In Progress",
    "remarks": "Subbase compacted; tack coat applied.",
    "materials_used": "Bitumen Emulsion & 10mm Aggregate",
    "actual_cost": 14500
  }
  ```

### `POST /repairs/{id}/complete`
- **Description**: Uploads repaired surface photo proof and marks ready for quality verification.
- **Form Data**:
  - `completion_image`: Binary image file
  - `completion_remarks`: `"Hot mix overlay laid and roller compacted."`
  - `materials_used`: `"Hot Bituminous Mix, Tack Coat"`
  - `actual_cost`: `16000`

### `POST /repairs/{id}/verify`
- **Description**: Authority officer approves the completed repair and closes complaint.
- **Request Body**:
  ```json
  {
    "verification_remarks": "Quality verified against standard IRC specifications.",
    "is_approved": true
  }
  ```

---

## 4. Admin Analytics Endpoints

### `GET /admin/dashboard`
- **Description**: Aggregates system metrics, Recharts distributions, and monthly velocity.
