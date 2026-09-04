# RoadGuard AI – Entity Relationship (ER) Diagram & Schema Specification

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "submits"
    USERS ||--o| ENGINEERS : "has_profile"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ STATUS_HISTORY : "triggers"
    USERS ||--o{ AUTHORITIES : "managed_by_admin"

    AUTHORITIES ||--o{ COMPLAINTS : "jurisdiction_over"
    AUTHORITIES ||--o{ ENGINEERS : "employs"

    COMPLAINTS ||--|| AI_RESULTS : "analyzed_by"
    COMPLAINTS ||--o| REPAIRS : "tracks_work"
    COMPLAINTS ||--o{ STATUS_HISTORY : "has_audit_trail"
    COMPLAINTS ||--o{ NOTIFICATIONS : "triggers_alerts"

    ENGINEERS ||--o{ REPAIRS : "executes"

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string phone
        string role "CITIZEN, AUTHORITY, ENGINEER, ADMIN"
        string district
        string state
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    AUTHORITIES {
        int id PK
        string code UK
        string name
        string authority_type "National Highway, State Highway, Municipal, Rural Road"
        string road_type_coverage
        string state
        string district
        text jurisdiction_area
        string contact_email
        string contact_phone
        boolean is_active
        int created_by_admin_id FK
        datetime created_at
    }

    ENGINEERS {
        int id PK
        int user_id FK,UK
        int authority_id FK
        string employee_id UK
        string designation
        string specialization
        int active_workload
        string status "ACTIVE, ON_LEAVE, INACTIVE"
        datetime created_at
    }

    COMPLAINTS {
        string id PK "e.g. RGD-2026-1001"
        int citizen_id FK
        int authority_id FK
        string road_name
        string road_type "National Highway, State Highway, Municipal, Rural Road"
        text description
        float latitude
        float longitude
        string district
        string state
        string landmark
        string image_url
        string status "Submitted, AI Analyzed, Authority Assigned, In Repair, Closed..."
        string priority "Low, Medium, High, Critical"
        text routing_notes
        datetime created_at
        datetime updated_at
    }

    AI_RESULTS {
        int id PK
        string complaint_id FK,UK
        string primary_damage_type "Pothole, Longitudinal Crack, Transverse Crack, Alligator Crack, Surface Damage"
        float confidence_score "0.0 - 1.0"
        string severity "Low, Medium, High, Critical"
        int damage_count
        text detections_json "Bounding boxes coordinates"
        string annotated_image_url
        string model_version
        float processing_time_ms
        datetime detection_timestamp
        string disclaimer
    }

    REPAIRS {
        int id PK
        string complaint_id FK,UK
        int engineer_id FK
        string current_stage "Assigned, Inspected, In Progress, Completed, Closed"
        text inspection_remarks
        datetime inspection_date
        datetime repair_start_date
        datetime repair_completion_date
        text completion_remarks
        string repair_after_image
        string materials_used
        float estimated_cost
        float actual_cost
        int verified_by_authority_id FK
        text verification_remarks
        datetime verification_date
        datetime created_at
    }

    STATUS_HISTORY {
        int id PK
        string complaint_id FK
        string from_status
        string to_status
        int changed_by_user_id FK
        string changed_by_role
        text remarks
        datetime timestamp
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string complaint_id FK
        string title
        text message
        string type "info, success, warning, urgent"
        boolean is_read
        string action_url
        datetime created_at
    }
```

---

## 2. Table Specifications & Normalization

- **Normalization**: Database adheres to **3rd Normal Form (3NF)** with zero transitive dependencies.
- **Constraints & Indexes**:
  - `users.email`: Unique index for fast auth lookup.
  - `complaints.latitude`, `complaints.longitude`: Indexed for rapid spatial bounds queries.
  - `complaints.status`, `complaints.road_type`, `complaints.district`: Indexed for dashboard filtering.
  - Foreign key cascading: Deleting a complaint safely cascades associated AI results and notifications.
