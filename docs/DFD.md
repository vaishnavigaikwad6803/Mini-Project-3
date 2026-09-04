# RoadGuard AI – Data Flow Diagrams (DFD)

## 1. Context Level DFD (Level 0)

```mermaid
flowchart TD
    Citizen([Citizen])
    Authority([Authority Officer])
    Engineer([Field Engineer])
    Admin([System Admin])

    System[("RoadGuard AI System")]

    Citizen -->|"1. Damage Image, GPS Coords, Road Type"| System
    System -->|"2. Complaint ID & Progress Notifications"| Citizen

    System -->|"3. Auto-Routed Damage Report & AI Results"| Authority
    Authority -->|"4. Work Order & Engineer Assignment"| System

    System -->|"5. Assigned Repair Task & Map Location"| Engineer
    Engineer -->|"6. Inspection Notes, Stage Updates & Photo Proof"| System

    System -->|"7. Completed Repair for Review"| Authority
    Authority -->|"8. Quality Verification & Closure Sign-off"| System

    Admin -->|"9. Authority & User Configurations"| System
    System -->|"10. Live KPI Analytics, Charts & CSV Exports"| Admin
```

---

## 2. Level 1 DFD: Complaint Intake & AI Processing

```mermaid
flowchart TD
    Citizen([Citizen])
    P1["1.0 Validate Image & Store Intake Data"]
    P2["2.0 YOLOv8 Computer Vision Pipeline"]
    P3["3.0 Authority Jurisdiction Router"]
    P4["4.0 Dispatch In-App Notifications"]

    D1[("Complaints Store")]
    D2[("AI Results Store")]
    D3[("Authorities Store")]
    D4[("Notifications Store")]

    Citizen -->|"Upload Photo & GPS Location"| P1
    P1 -->|"Create Complaint (Submitted)"| D1
    P1 -->|"Trigger Raw Image File"| P2

    P2 -->|"Run OpenCV Preprocessing & YOLO Inference"| P2
    P2 -->|"Store Bounding Boxes & Confidence"| D2
    P2 -->|"Update Status: AI Analyzed"| D1

    P2 -->|"Pass Road Type & District"| P3
    D3 -->|"Match Jurisdiction Rules"| P3
    P3 -->|"Update Assigned Authority"| D1

    P3 -->|"Trigger Notification Events"| P4
    P4 -->|"Store Alert Logs"| D4
    P4 -->|"Notify Citizen & Authority Officer"| Citizen
```

---

## 3. Level 2 DFD: Maintenance Execution & Authority Closure

```mermaid
flowchart TD
    Authority([Authority Officer])
    Engineer([Field Engineer])

    P5["5.0 Assign Field Engineer"]
    P6["6.0 Conduct Site Inspection & Repairs"]
    P7["7.0 Upload Repaired Photo Proof"]
    P8["8.0 Quality Verification & Final Closure"]

    D1[("Complaints Store")]
    D5[("Repairs Store")]
    D6[("Status History Audit Trail")]

    Authority -->|"Select Engineer & Remarks"| P5
    P5 -->|"Create Repair Record"| D5
    P5 -->|"Transition Status: Engineer Assigned"| D1
    P5 -->|"Log Status Change"| D6

    Engineer -->|"Inspect & Commences Repair"| P6
    P6 -->|"Update Progressive Stage (In Progress)"| D5
    P6 -->|"Log Milestones"| D6

    Engineer -->|"Submit Completion Photo & Material Cost"| P7
    P7 -->|"Mark Repair Completed"| D5
    P7 -->|"Set Status: Authority Verification"| D1
    P7 -->|"Log Completion Entry"| D6

    Authority -->|"Review Before & After Photos"| P8
    P8 -->|"Approve & Close Complaint"| D1
    P8 -->|"Mark Repair Stage Closed"| D5
    P8 -->|"Final Closure Audit Entry"| D6
```
