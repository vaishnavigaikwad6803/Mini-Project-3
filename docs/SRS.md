# RoadGuard AI – Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
RoadGuard AI is an automated road damage detection and multi-authority road maintenance governance system designed to streamline citizen grievance reporting, computer vision damage classification (via Ultralytics YOLOv8), automatic jurisdiction routing, field engineer dispatch, and verified repair sign-off.

### 1.2 Scope
- **Citizen Portal**: Upload road surface defect images, capture GPS coordinates, monitor complaint lifecycle.
- **AI Computer Vision Subsystem**: YOLOv8 + OpenCV preprocessing for defect localization, bounding box rendering, confidence scoring, and severity assessment.
- **Authority Routing Engine**: Automatic assignment based on configured Road Types (*National Highway*, *State Highway*, *Municipal/City Road*, *Rural/Village Road*) and geographic districts.
- **Field Engineer Operations**: Site inspection logging, multi-stage repair updates, before-and-after photo upload.
- **Executive Administration & GIS**: System-wide analytics, Recharts data visualizers, Leaflet spatial mapping, and user/authority management.

---

## 2. Overall Description

### 2.1 User Roles & Permissions Matrix

| Feature / Action | Citizen | Authority Officer | Field Engineer | System Admin |
| :--- | :---: | :---: | :---: | :---: |
| Register & Login | ✅ | ✅ | ✅ | ✅ |
| Submit Road Damage Report | ✅ | ❌ | ❌ | ✅ |
| View Assigned Complaints | Own | Jurisdiction | Assigned Tasks | All System |
| Execute YOLOv8 AI Detection | Automated | Automated | Automated | ✅ / Standalone |
| Assign Field Engineer | ❌ | ✅ | ❌ | ✅ |
| Conduct Site Inspection | ❌ | ❌ | ✅ | ❌ |
| Update Repair Milestones | ❌ | ❌ | ✅ | ❌ |
| Upload Repaired Photo Proof | ❌ | ❌ | ✅ | ❌ |
| Quality Verify & Close Complaint | ❌ | ✅ | ❌ | ✅ |
| Manage Authorities & Users | ❌ | ❌ | ❌ | ✅ |
| System KPIs & CSV Export | ❌ | Jurisdiction | ❌ | ✅ Global |

---

## 3. Functional Requirements

### 3.1 Module 1 – Authentication & RBAC
- **FR-1.1**: Secure user registration for citizens with district/state capture.
- **FR-1.2**: JWT (JSON Web Token) authentication with SHA-256 / HS256 encryption.
- **FR-1.3**: Direct bcrypt password hashing with salt generation.
- **FR-1.4**: Role-based access control protecting all backend API routes and frontend pages.

### 3.2 Module 2 & 3 – Complaint Intake & Geo-Location
- **FR-2.1**: Road damage image validation (JPEG, PNG, WEBP; max 10MB).
- **FR-2.2**: Form capture: Road Name, Road Type, Description, Landmark, District, State.
- **FR-2.3**: Leaflet interactive MapPicker with browser GPS auto-detect.
- **FR-2.4**: Unique Complaint ID generator (`RGD-YYYY-XXXX`).

### 3.3 Module 4 & 5 – AI Road Damage Detection
- **FR-3.1**: OpenCV preprocessing and dimension normalization.
- **FR-3.2**: YOLOv8 neural inference with damage classification:
  - *Pothole*
  - *Longitudinal Crack*
  - *Transverse Crack*
  - *Alligator Crack*
  - *Surface Damage*
- **FR-3.3**: Bounding box coordinate generation, area percentage calculation, and confidence score.
- **FR-3.4**: High-visibility annotated image output with mandatory watermark: *"AI-Assisted Detection"*.

### 3.4 Module 6 & 7 – Authority Routing & Portals
- **FR-4.1**: Dynamic routing engine matching `Road Type` + `District`/`State` to registered `Authorities`.
- **FR-4.2**: Dedicated modules for National Highway (NHAI), State Highway (PWD), Municipal (BMC), and Rural (PMGSY).
- **FR-4.3**: Authority Officer complaint review and 1-click field engineer assignment.

### 3.5 Module 8, 9 & 10 – Engineer Operations & Repair Timeline
- **FR-5.1**: Multi-stage repair tracking:
  `Assigned` ➔ `Inspection Pending` ➔ `Inspection Completed` ➔ `Repair Started` ➔ `Repair In Progress` ➔ `Repair Completed` ➔ `Authority Verification` ➔ `Closed`.
- **FR-5.2**: Repair proof image upload with materials used and expenditure logging.
- **FR-5.3**: Immutable `status_history` audit trail logging timestamp, actor role, and notes.

### 3.6 Module 11, 12, 13 & 14 – Notifications, GIS Map & Admin
- **FR-6.1**: Real-time in-app notification center for milestones and work orders.
- **FR-6.2**: Leaflet OpenStreetMap with damage type color-coded markers and popup previews.
- **FR-6.3**: Admin Recharts analytics (road type breakdown, damage distribution, monthly trends, authority performance).
- **FR-6.4**: CSV data export for municipal reporting and compliance.

---

## 4. Non-Functional Requirements

- **Performance**: YOLOv8 inference latency < 250ms on CPU/GPU.
- **Security**: Zero plain-text passwords; JWT expiration after 7 days; file validation prevents shell script uploads.
- **Usability**: Fully responsive desktop and mobile layouts with dark infrastructure aesthetic.
- **Reliability**: Seamless computer vision heuristic fallback if neural weights are downloading or uninitialized.
