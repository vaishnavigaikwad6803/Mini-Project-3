# 🛣️ RoadGuard AI
### AI-Based Road Damage Detection and Multi-Authority Road Governance Systems

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![YOLOv8](https://img.shields.io/badge/AI_Vision-Ultralytics_YOLOv8-FF6F00?style=flat&logo=python)](https://github.com/ultralytics/ultralytics)
[![OpenStreetMap](https://img.shields.io/badge/GIS-Leaflet_%2B_OSM-199900?style=flat&logo=leaflet)](https://leafletjs.com/)

---

## 📌 1. Project Overview

**RoadGuard AI** is an automated full-stack platform designed to resolve road defect grievances across Indian and global road networks. Citizens report road surface damage (potholes, cracks, rutting) by uploading photos and pinpointing GPS coordinates. 

The system executes **YOLOv8 computer vision detection**, computes severity and confidence ratings, automatically matches and routes complaints to the responsible **Road Authority** (National Highways, State PWD, Municipal Corporation, or Rural PMGSY), and oversees the repair lifecycle through **Field Engineer dispatch**, progressive work milestones, and verified photographic closure.

---

## 🏛️ 2. Four-Tier Multi-Authority Architecture

```
                                  [ Citizen Reports Defect ]
                                              │
                                              ▼
                             [ YOLOv8 AI Computer Vision ]
                        (Pothole / Crack / Rutting / Severity)
                                              │
                                              ▼
                             [ Authority Routing Engine ]
                                              │
               ┌──────────────────────────────┼──────────────────────────────┐
               ▼                              ▼                              ▼
      [ National Highway ]            [ State Highway ]            [ Municipal / City ]
       (NHAI Division)                 (State PWD)                  (City Corporation)
               │                              │                              │
               └──────────────────────────────┼──────────────────────────────┘
                                              │
                                              ▼
                                 [ Field Engineer Assigned ]
                               (Site Visit ➔ Compaction ➔ Repair)
                                              │
                                              ▼
                              [ Photographic Proof Upload ]
                                              │
                                              ▼
                             [ Authority Verification & Closure ]
```

---

## 🔑 3. Pre-Configured Demo Accounts

Use these one-click credentials (or the quick buttons in the web UI) to test all roles immediately:

| Role | Quick Email | Official Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@roadguard.ai` | `admin@roadguard.ai` | `password123` | Master analytics, configure authorities, manage users, global complaints |
| **NHAI Authority** | `nhai@roadguard.ai` | `nhai.officer@roadguard.ai` | `password123` | National Highways jurisdiction, engineer dispatch, quality sign-off |
| **State PWD Authority**| `pwd@roadguard.ai` | `pwd.officer@roadguard.ai` | `password123` | State Highways and major district road maintenance |
| **Municipal Authority**| `municipal@roadguard.ai` | `bmc.officer@roadguard.ai` | `password123` | City roads, storm drains, street pothole repair (BMC/Municipal Corp) |
| **Rural PMGSY Authority**| `pmgsy@roadguard.ai` | `pmgsy.officer@roadguard.ai` | `password123` | Rural roads and village connectivity corridors |
| **Field Engineer (NHAI)**| `engineer@roadguard.ai` | `engineer.rajesh@roadguard.ai` | `password123` | Field workstation, update repair stages, upload after-repair photo |
| **Field Engineer (PWD)** | `engineer.vikram@roadguard.ai` | `engineer.vikram@roadguard.ai` | `password123` | Inspection notes, material usage logging, repair execution |
| **Citizen User** | `citizen@roadguard.ai` | `citizen.aarav@gmail.com` | `password123` | Report road defects, interactive map picker, complaint tracking |

> **Note:** For maximum convenience in local development and evaluation, all demo accounts accept `password123` (as well as their legacy role passwords like `AuthorityPass123`, `AdminPassword123`, `EngineerPass123`, `CitizenPass123`).

---

## 🚀 4. Quick Start & Execution Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

---

### Step 1: Backend Setup & Database Seeding

Open a terminal and navigate to `backend/`:

```bash
# 1. Navigate to backend directory
cd backend

# 2. (Optional) Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. Seed Database with Authorities, Users, Engineers & Complaints
python seed_data.py

# 5. Start the FastAPI Development Server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend API**: `http://localhost:8000`
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc API Reference**: `http://localhost:8000/redoc`

---

### Step 2: Frontend Setup

Open a second terminal and navigate to `frontend/`:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server
npm run dev
```

- **Frontend Application**: `http://localhost:5173`

---

## 💡 5. Key System Features & Highlights

1. **YOLOv8 Computer Vision Pipeline (`detector.py`)**:
   - Analyzes uploaded road images with OpenCV color enhancement.
   - Detects 5 damage categories: *Pothole*, *Longitudinal Crack*, *Transverse Crack*, *Alligator Crack*, *Surface Damage*.
   - Renders aesthetic bounding box overlays, confidence score bars, and severity levels.
   - Distinctly labeled with mandatory legal disclaimer: *"AI-Assisted Detection"*.

2. **Automated Authority Routing (`routing_service.py`)**:
   - Analyzes `Road Type` (National Highway, State Highway, Municipal, Rural) and `District`.
   - Directs grievance to the exact registered authority branch without citizen guesswork.

3. **Field Engineer Workstation (`repairs_router.py`)**:
   - Progressive milestone tracking:
     `Assigned` ➔ `Inspection Pending` ➔ `Inspection Completed` ➔ `Repair Started` ➔ `Repair In Progress` ➔ `Repair Completed` ➔ `Authority Verification` ➔ `Closed`.
   - Side-by-side photographic proof comparison (*Before Repair* vs *After Repair*).

4. **Executive Administration & Analytics Hub (`analytics_service.py`)**:
   - Recharts visual charts for Road Type breakdown, Damage distribution, Monthly intake velocity, and Authority turnaround performance.
   - One-click CSV export for municipal audits.

5. **GIS Spatial Leaflet Heatmap (`ComplaintMap.jsx`)**:
   - OpenStreetMap coordinates with damage severity colored pins and instant detail modals.

---

## 🎓 6. College Mini-Project Presentation & Viva Q&A

### Q1: Why use YOLOv8 over standard image classification?
> **Answer**: Standard image classification only outputs a single whole-image label. YOLOv8 is an **object detector** that localizes multiple distinct defects simultaneously, computes bounding box dimensions (width, height, area percentage), and accurately differentiates co-occurring defects (e.g. pothole alongside longitudinal cracks).

### Q2: How does the multi-authority routing work?
> **Answer**: In India and most municipal jurisdictions, road ownership is divided: National Highways belong to NHAI, State Highways to PWD, city streets to Municipal Corporations, and village roads to PMGSY. RoadGuard AI matches the user's selected road type and district against active Authority records configured in the admin database.

### Q3: How is data security and role-based access enforced?
> **Answer**: Endpoints are secured via HTTP Bearer JWT tokens. Passwords are salted and hashed using direct `bcrypt`. Fast-path Python decorators (`require_citizen`, `require_authority`, `require_engineer`, `require_admin`) ensure users cannot access unauthorized jurisdiction data.

---

## 📂 7. Project Directory Structure

```
MINI 3/
├── backend/
│   ├── app/
│   │   ├── ai/               # YOLOv8 detector & OpenCV pipeline
│   │   ├── api/              # FastAPI REST routers (auth, complaints, repairs, admin, etc.)
│   │   ├── auth/             # JWT encryption & RBAC dependencies
│   │   ├── models/           # SQLAlchemy database schemas
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Routing, timeline, analytics, notifications
│   │   ├── database.py       # Engine & SQLite session
│   │   └── main.py           # FastAPI entrypoint & CORS
│   ├── seed_data.py          # Database seeder with realistic test data
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/       # AI cards, Leaflet maps, timelines, modals
│   │   ├── context/          # AuthContext & NotificationContext
│   │   ├── layouts/          # MainLayout & DashboardLayout
│   │   ├── pages/
│   │   │   ├── public/       # Home, Login, Register, TrackComplaint, PublicMap
│   │   │   ├── citizen/      # CitizenDashboard, SubmitComplaint, MyComplaints, ComplaintDetails
│   │   │   ├── authority/    # AuthorityDashboard, AuthorityComplaints, AuthorityEngineers
│   │   │   ├── engineer/     # EngineerDashboard, EngineerAssignments
│   │   │   └── admin/        # AdminDashboard, ManageUsers, ManageAuthorities, ManageComplaints
│   │   ├── services/         # Axios API clients
│   │   ├── App.jsx           # Master route wiring
│   │   └── main.jsx          # React DOM mounting
│   ├── package.json
│   └── vite.config.js
│
└── docs/
    ├── SRS.md                # Software Requirements Specification
    ├── ER_DIAGRAM.md         # ER diagram and database specification
    ├── DFD.md                # Context, Level 1 & Level 2 Data Flow Diagrams
    └── API_DOCUMENTATION.md  # REST API specs & JSON schemas
```
