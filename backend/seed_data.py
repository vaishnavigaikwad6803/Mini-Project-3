import os
import json
import numpy as np
# pyrefly: ignore [missing-import]
import cv2
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.authority import Authority, AuthorityType
from app.models.engineer import Engineer, EngineerStatus
from app.models.complaint import Complaint, ComplaintStatus, RoadType, PriorityLevel
from app.models.ai_result import AIResult, DamageClass, SeverityLevel
from app.models.repair import Repair, RepairStage
from app.models.status_history import StatusHistory
from app.models.notification import Notification, NotificationType
from app.auth.security import get_password_hash

# Ensure directories exist
for sub in ["complaints", "annotated", "repairs"]:
    (Path(settings.UPLOAD_DIR_PATH) / sub).mkdir(parents=True, exist_ok=True)

def generate_sample_image(filename: str, damage_type: str, is_repaired: bool = False, is_annotated: bool = False) -> str:
    """Generates synthetic high-quality road texture images for seed demonstration."""
    h, w = 600, 800
    subfolder = "annotated" if is_annotated else ("repairs" if is_repaired else "complaints")
    filepath = Path(settings.UPLOAD_DIR_PATH) / subfolder / filename

    if not filepath.exists():
        # Create asphalt texture base
        if is_repaired:
            # Fresh dark asphalt
            img = np.full((h, w, 3), (45, 48, 52), dtype=np.uint8)
            noise = np.random.normal(0, 8, (h, w, 3)).astype(np.int16)
            img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            # Smooth patch
            cv2.rectangle(img, (180, 200), (620, 480), (35, 38, 42), -1)
            cv2.putText(img, "[ REPAIRED SURFACE - FRESH BITUMINOUS OVERLAY ]", (190, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 240, 180), 2)
        else:
            # Worn asphalt
            img = np.full((h, w, 3), (85, 90, 95), dtype=np.uint8)
            noise = np.random.normal(0, 15, (h, w, 3)).astype(np.int16)
            img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            
            # Draw defect representation
            if "Pothole" in damage_type:
                cv2.ellipse(img, (400, 360), (140, 90), 0, 0, 360, (25, 28, 30), -1)
                cv2.ellipse(img, (400, 360), (140, 90), 0, 0, 360, (140, 145, 150), 3)
                cv2.circle(img, (380, 350), 45, (15, 18, 20), -1)
            elif "Crack" in damage_type:
                pts = np.array([[200, 450], [280, 380], [350, 390], [440, 280], [560, 250], [680, 180]], np.int32)
                cv2.polylines(img, [pts], False, (20, 22, 25), 6)
                cv2.polylines(img, [pts + np.array([20, -10])], False, (30, 32, 35), 4)
            else:
                cv2.rectangle(img, (220, 220), (580, 440), (40, 45, 50), -1)

        if is_annotated:
            # Draw AI bounding box overlay
            cv2.rectangle(img, (240, 240), (560, 460), (0, 0, 255), 3)
            # Corner accents
            cv2.line(img, (240, 240), (270, 240), (255, 255, 255), 4)
            cv2.line(img, (240, 240), (240, 270), (255, 255, 255), 4)
            cv2.line(img, (560, 460), (530, 460), (255, 255, 255), 4)
            cv2.line(img, (560, 460), (560, 430), (255, 255, 255), 4)
            # Tag
            cv2.rectangle(img, (240, 205), (460, 240), (0, 0, 255), -1)
            cv2.putText(img, f"{damage_type} (92%)", (248, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            # Top banner
            cv2.rectangle(img, (0, 0), (w, 40), (20, 24, 30), -1)
            cv2.putText(img, "RoadGuard AI - AI-Assisted Detection [YOLOv8 Engine]", (15, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)

        cv2.imwrite(str(filepath), img)

    return f"/uploads/{subfolder}/{filename}"

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print("--> Seeding RoadGuard AI Database...")

        # 1. Create Users
        admin_user = User(
            email="admin@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Dr. Suresh Rao (Administrator)",
            phone="+91 98200 11223",
            role=UserRole.ADMIN,
            district="Mumbai",
            state="Maharashtra",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        citizen_user = User(
            email="citizen@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Rahul Sharma",
            phone="+91 98765 43210",
            role=UserRole.CITIZEN,
            district="Mumbai Suburban",
            state="Maharashtra",
            is_active=True
        )
        citizen2 = User(
            email="citizen.aarav@gmail.com",
            hashed_password=get_password_hash("password123"),
            full_name="Aarav Deshmukh",
            phone="+91 98111 22334",
            role=UserRole.CITIZEN,
            district="Thane",
            state="Maharashtra",
            is_active=True
        )
        db.add_all([citizen_user, citizen2])

        # Authority Officers (Primary + Short Aliases for 1-Click UI Logins)
        auth_user_nhai = User(
            email="nhai@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Rajesh Verma (NHAI Highway Officer)",
            phone="+91 94230 55667",
            role=UserRole.AUTHORITY,
            district="Mumbai Suburban",
            state="Maharashtra",
            is_active=True
        )
        auth_user_nhai_officer = User(
            email="nhai.officer@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Rajesh Verma (NHAI Highway Officer)",
            phone="+91 94230 55667",
            role=UserRole.AUTHORITY,
            district="Mumbai Suburban",
            state="Maharashtra",
            is_active=True
        )
        auth_user_pwd = User(
            email="pwd@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Sunil Kulkarni (State PWD Executive)",
            phone="+91 94220 88990",
            role=UserRole.AUTHORITY,
            district="Pune",
            state="Maharashtra",
            is_active=True
        )
        auth_user_pwd_officer = User(
            email="pwd.officer@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Sunil Kulkarni (State PWD Executive)",
            phone="+91 94220 88990",
            role=UserRole.AUTHORITY,
            district="Pune",
            state="Maharashtra",
            is_active=True
        )
        auth_user_bmc = User(
            email="municipal@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Pradeep Kamble (BMC Municipal Officer)",
            phone="+91 98210 33445",
            role=UserRole.AUTHORITY,
            district="Mumbai",
            state="Maharashtra",
            is_active=True
        )
        auth_user_bmc_officer = User(
            email="bmc.officer@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Pradeep Kamble (BMC Municipal Officer)",
            phone="+91 98210 33445",
            role=UserRole.AUTHORITY,
            district="Mumbai",
            state="Maharashtra",
            is_active=True
        )
        auth_user_bmc_alias = User(
            email="bmc@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Pradeep Kamble (BMC Municipal Officer)",
            phone="+91 98210 33445",
            role=UserRole.AUTHORITY,
            district="Mumbai",
            state="Maharashtra",
            is_active=True
        )
        auth_user_pmgsy = User(
            email="pmgsy@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Manohar Patil (Rural PMGSY Officer)",
            phone="+91 97650 44556",
            role=UserRole.AUTHORITY,
            district="Thane",
            state="Maharashtra",
            is_active=True
        )
        auth_user_pmgsy_officer = User(
            email="pmgsy.officer@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Manohar Patil (Rural PMGSY Officer)",
            phone="+91 97650 44556",
            role=UserRole.AUTHORITY,
            district="Thane",
            state="Maharashtra",
            is_active=True
        )
        db.add_all([
            auth_user_nhai, auth_user_nhai_officer, 
            auth_user_pwd, auth_user_pwd_officer, 
            auth_user_bmc, auth_user_bmc_officer, auth_user_bmc_alias,
            auth_user_pmgsy, auth_user_pmgsy_officer
        ])

        # Engineer Users
        eng_user_1 = User(
            email="engineer@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Ramesh Patil (NHAI Field Eng)",
            phone="+91 98330 12345",
            role=UserRole.ENGINEER,
            district="Mumbai Suburban",
            state="Maharashtra",
            is_active=True
        )
        eng_user_1_officer = User(
            email="engineer.rajesh@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Ramesh Patil (NHAI Field Eng)",
            phone="+91 98330 12345",
            role=UserRole.ENGINEER,
            district="Mumbai Suburban",
            state="Maharashtra",
            is_active=True
        )
        eng_user_2 = User(
            email="engineer.vikram@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Vikram More (PWD Field Eng)",
            phone="+91 98330 67890",
            role=UserRole.ENGINEER,
            district="Pune",
            state="Maharashtra",
            is_active=True
        )
        eng_user_3 = User(
            email="engineer.aniket@roadguard.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Aniket Shinde (Municipal Ward Eng)",
            phone="+91 98330 54321",
            role=UserRole.ENGINEER,
            district="Mumbai",
            state="Maharashtra",
            is_active=True
        )
        db.add_all([eng_user_1, eng_user_1_officer, eng_user_2, eng_user_3])
        db.commit()

        # 2. Create Authorities
        auth_nhai = Authority(
            code="NHAI-RO-MUM",
            name="National Highways Authority of India (NHAI RO Mumbai)",
            authority_type=AuthorityType.NATIONAL_HIGHWAY,
            road_type_coverage="National Highway",
            state="Maharashtra",
            district="Mumbai Suburban",
            jurisdiction_area="Western Express Highway, Eastern Express Highway & NH-48 Corridor",
            contact_email="nhai.mumbai@roadguard.ai",
            contact_phone="022-26590001",
            is_active=True,
            created_by_admin_id=admin_user.id
        )
        auth_pwd = Authority(
            code="PWD-PUNE-01",
            name="Maharashtra State Highway & PWD Authority (Pune Division)",
            authority_type=AuthorityType.STATE_HIGHWAY,
            road_type_coverage="State Highway",
            state="Maharashtra",
            district="Pune",
            jurisdiction_area="SH-27, SH-114 Pune-Solapur & Regional Highway Links",
            contact_email="pwd.pune@roadguard.ai",
            contact_phone="020-25678899",
            is_active=True,
            created_by_admin_id=admin_user.id
        )
        auth_bmc = Authority(
            code="MCGM-RDS-MUM",
            name="Brihanmumbai Municipal Corporation - Roads & Traffic Dept",
            authority_type=AuthorityType.MUNICIPAL,
            road_type_coverage="Municipal/City Road",
            state="Maharashtra",
            district="Mumbai",
            jurisdiction_area="Greater Mumbai Municipal Roads, Arterial & Link Roads",
            contact_email="roads.bmc@roadguard.ai",
            contact_phone="022-22620251",
            is_active=True,
            created_by_admin_id=admin_user.id
        )
        auth_pmgsy = Authority(
            code="PMGSY-ZP-THN",
            name="Thane Zilla Parishad Rural Roads Division (PMGSY)",
            authority_type=AuthorityType.RURAL_ROAD,
            road_type_coverage="Rural/Village Road",
            state="Maharashtra",
            district="Thane",
            jurisdiction_area="Murbad, Shahapur & Kalyan Rural Village Road Network",
            contact_email="ruralroads.thane@roadguard.ai",
            contact_phone="022-25341234",
            is_active=True,
            created_by_admin_id=admin_user.id
        )
        db.add_all([auth_nhai, auth_pwd, auth_bmc, auth_pmgsy])
        db.commit()

        # 3. Create Engineer Profiles
        eng_profile_1 = Engineer(
            user_id=eng_user_1.id,
            authority_id=auth_nhai.id,
            employee_id="ENG-NHAI-101",
            designation="Senior Pavement Maintenance Engineer",
            specialization="Bituminous Highway Surface & Asphalt Layering",
            active_workload=2,
            status=EngineerStatus.ACTIVE
        )
        eng_profile_1_officer = Engineer(
            user_id=eng_user_1_officer.id,
            authority_id=auth_nhai.id,
            employee_id="ENG-NHAI-102",
            designation="Senior Pavement Maintenance Engineer",
            specialization="Bituminous Highway Surface & Asphalt Layering",
            active_workload=1,
            status=EngineerStatus.ACTIVE
        )
        eng_profile_2 = Engineer(
            user_id=eng_user_2.id,
            authority_id=auth_pwd.id,
            employee_id="ENG-PWD-204",
            designation="Assistant Executive Engineer",
            specialization="State Highway Crack Sealing & Base Reconstruction",
            active_workload=1,
            status=EngineerStatus.ACTIVE
        )
        eng_profile_3 = Engineer(
            user_id=eng_user_3.id,
            authority_id=auth_bmc.id,
            employee_id="ENG-BMC-305",
            designation="Ward Maintenance Engineer (K-West)",
            specialization="Urban Road Pothole Patching & Cold Bitumen Mix",
            active_workload=1,
            status=EngineerStatus.ACTIVE
        )
        db.add_all([eng_profile_1, eng_profile_1_officer, eng_profile_2, eng_profile_3])
        db.commit()

        # 4. Generate Images and Complaints
        # Complaint 1: NHAI - In Repair
        img_url_1 = generate_sample_image("pothole_nh48.jpg", "Pothole")
        ann_url_1 = generate_sample_image("ann_pothole_nh48.jpg", "Pothole", is_annotated=True)
        c1 = Complaint(
            id="RGD-2026-1001",
            citizen_id=citizen_user.id,
            authority_id=auth_nhai.id,
            road_name="Western Express Highway (Near Andheri Flyover)",
            road_type=RoadType.NATIONAL_HIGHWAY,
            description="Deep pothole in the center lane causing sudden vehicle braking and accident risk.",
            latitude=19.1197,
            longitude=72.8464,
            district="Mumbai Suburban",
            state="Maharashtra",
            landmark="Near Gundavali Metro Station Pillar 142",
            image_url=img_url_1,
            status=ComplaintStatus.REPAIR_IN_PROGRESS,
            priority=PriorityLevel.CRITICAL,
            routing_notes="Auto-routed to NHAI RO Mumbai for National Highway corridor.",
            created_at=datetime.utcnow() - timedelta(days=3)
        )
        db.add(c1)
        db.commit()

        ai_1 = AIResult(
            complaint_id=c1.id,
            primary_damage_type=DamageClass.POTHOLE,
            confidence_score=0.94,
            severity=SeverityLevel.CRITICAL,
            damage_count=2,
            detections_json=json.dumps([
                {"bbox": [240.0, 260.0, 580.0, 480.0], "class_name": "Pothole", "confidence": 0.94, "area_percentage": 18.5},
                {"bbox": [120.0, 380.0, 230.0, 450.0], "class_name": "Surface Damage", "confidence": 0.82, "area_percentage": 4.2}
            ]),
            annotated_image_url=ann_url_1,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=115.4
        )
        db.add(ai_1)

        rep_1 = Repair(
            complaint_id=c1.id,
            engineer_id=eng_profile_1.id,
            current_stage=RepairStage.REPAIR_IN_PROGRESS,
            inspection_remarks="Site inspected. Pothole measures 1.2m x 0.8m with 8cm depth. Base course compaction and cold mix application underway.",
            inspection_date=datetime.utcnow() - timedelta(days=2),
            repair_start_date=datetime.utcnow() - timedelta(days=1),
            materials_used="Dense Bituminous Macadam (DBM), Bitumen Emulsion Tack Coat",
            estimated_cost=18500.0
        )
        db.add(rep_1)

        # Complaint 2: PWD - Assigned
        img_url_2 = generate_sample_image("crack_sh27.jpg", "Longitudinal Crack")
        ann_url_2 = generate_sample_image("ann_crack_sh27.jpg", "Longitudinal Crack", is_annotated=True)
        c2 = Complaint(
            id="RGD-2026-1002",
            citizen_id=citizen_user.id,
            authority_id=auth_pwd.id,
            road_name="Pune-Nagar Highway (SH-27 Km 18)",
            road_type=RoadType.STATE_HIGHWAY,
            description="Extensive longitudinal cracking along wheel path on southbound carriageway.",
            latitude=18.5679,
            longitude=73.9143,
            district="Pune",
            state="Maharashtra",
            landmark="Opposite Viman Nagar Junction",
            image_url=img_url_2,
            status=ComplaintStatus.ENGINEER_ASSIGNED,
            priority=PriorityLevel.HIGH,
            routing_notes="Auto-routed to Maharashtra PWD Pune for State Highway.",
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(c2)
        db.commit()

        ai_2 = AIResult(
            complaint_id=c2.id,
            primary_damage_type=DamageClass.LONGITUDINAL_CRACK,
            confidence_score=0.89,
            severity=SeverityLevel.HIGH,
            damage_count=1,
            detections_json=json.dumps([
                {"bbox": [180.0, 190.0, 620.0, 460.0], "class_name": "Longitudinal Crack", "confidence": 0.89, "area_percentage": 14.8}
            ]),
            annotated_image_url=ann_url_2,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=108.2
        )
        db.add(ai_2)

        rep_2 = Repair(
            complaint_id=c2.id,
            engineer_id=eng_profile_2.id,
            current_stage=RepairStage.ASSIGNED
        )
        db.add(rep_2)

        # Complaint 3: Municipal - Inspection Completed
        img_url_3 = generate_sample_image("alligator_andheri.jpg", "Alligator Crack")
        ann_url_3 = generate_sample_image("ann_alligator_andheri.jpg", "Alligator Crack", is_annotated=True)
        c3 = Complaint(
            id="RGD-2026-1003",
            citizen_id=citizen2.id,
            authority_id=auth_bmc.id,
            road_name="SV Road (Near Bandra Railway Station)",
            road_type=RoadType.MUNICIPAL_ROAD,
            description="Severe alligator fatigue cracking and surface degradation creating bumps for two-wheelers.",
            latitude=19.0596,
            longitude=72.8295,
            district="Mumbai",
            state="Maharashtra",
            landmark="Near Lucky Restaurant signal",
            image_url=img_url_3,
            status=ComplaintStatus.INSPECTION_COMPLETED,
            priority=PriorityLevel.HIGH,
            routing_notes="Auto-routed to BMC Municipal Roads Department.",
            created_at=datetime.utcnow() - timedelta(days=4)
        )
        db.add(c3)
        db.commit()

        ai_3 = AIResult(
            complaint_id=c3.id,
            primary_damage_type=DamageClass.ALLIGATOR_CRACK,
            confidence_score=0.91,
            severity=SeverityLevel.HIGH,
            damage_count=2,
            detections_json=json.dumps([
                {"bbox": [210.0, 230.0, 590.0, 470.0], "class_name": "Alligator Crack", "confidence": 0.91, "area_percentage": 16.2},
                {"bbox": [100.0, 310.0, 200.0, 420.0], "class_name": "Surface Damage", "confidence": 0.79, "area_percentage": 5.1}
            ]),
            annotated_image_url=ann_url_3,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=124.0
        )
        db.add(ai_3)

        rep_3 = Repair(
            complaint_id=c3.id,
            engineer_id=eng_profile_3.id,
            current_stage=RepairStage.INSPECTION_COMPLETED,
            inspection_remarks="Site inspection completed. Subgrade fatigue noted. Full depth patching required with mastic asphalt overlay scheduled for Thursday night shift.",
            inspection_date=datetime.utcnow() - timedelta(days=1),
            estimated_cost=24000.0
        )
        db.add(rep_3)

        # Complaint 4: Rural - Submitted / AI Analyzed
        img_url_4 = generate_sample_image("rural_murbad.jpg", "Surface Damage")
        ann_url_4 = generate_sample_image("ann_rural_murbad.jpg", "Surface Damage", is_annotated=True)
        c4 = Complaint(
            id="RGD-2026-1004",
            citizen_id=citizen2.id,
            authority_id=auth_pmgsy.id,
            road_name="Murbad-Mhasa Village Connector Road",
            road_type=RoadType.RURAL_ROAD,
            description="Washed out gravel edge and surface pitting after heavy monsoon runoff.",
            latitude=19.2520,
            longitude=73.3980,
            district="Thane",
            state="Maharashtra",
            landmark="Near Gram Panchayat Office",
            image_url=img_url_4,
            status=ComplaintStatus.AUTHORITY_ASSIGNED,
            priority=PriorityLevel.MEDIUM,
            routing_notes="Auto-routed to Thane PMGSY Rural Roads Division.",
            created_at=datetime.utcnow() - timedelta(hours=8)
        )
        db.add(c4)
        db.commit()

        ai_4 = AIResult(
            complaint_id=c4.id,
            primary_damage_type=DamageClass.SURFACE_DAMAGE,
            confidence_score=0.86,
            severity=SeverityLevel.MEDIUM,
            damage_count=1,
            detections_json=json.dumps([
                {"bbox": [200.0, 240.0, 600.0, 480.0], "class_name": "Surface Damage", "confidence": 0.86, "area_percentage": 12.0}
            ]),
            annotated_image_url=ann_url_4,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=98.5
        )
        db.add(ai_4)

        # Complaint 5: Closed & Verified by NHAI
        img_url_5 = generate_sample_image("pothole_nh48_old.jpg", "Pothole")
        ann_url_5 = generate_sample_image("ann_pothole_nh48_old.jpg", "Pothole", is_annotated=True)
        rep_img_5 = generate_sample_image("repaired_nh48.jpg", "Pothole", is_repaired=True)
        c5 = Complaint(
            id="RGD-2026-1005",
            citizen_id=citizen_user.id,
            authority_id=auth_nhai.id,
            road_name="Mumbai-Ahmedabad Highway NH-48 (Km 464)",
            road_type=RoadType.NATIONAL_HIGHWAY,
            description="Multiple edge potholes on fast lane near Ghodbunder junction.",
            latitude=19.2952,
            longitude=72.9342,
            district="Thane",
            state="Maharashtra",
            landmark="Near Fountain Hotel junction",
            image_url=img_url_5,
            status=ComplaintStatus.CLOSED,
            priority=PriorityLevel.HIGH,
            routing_notes="Auto-routed to NHAI RO Mumbai.",
            created_at=datetime.utcnow() - timedelta(days=10),
            updated_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(c5)
        db.commit()

        ai_5 = AIResult(
            complaint_id=c5.id,
            primary_damage_type=DamageClass.POTHOLE,
            confidence_score=0.96,
            severity=SeverityLevel.HIGH,
            damage_count=2,
            detections_json=json.dumps([
                {"bbox": [220.0, 240.0, 580.0, 460.0], "class_name": "Pothole", "confidence": 0.96, "area_percentage": 15.4}
            ]),
            annotated_image_url=ann_url_5,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=112.0
        )
        db.add(ai_5)

        rep_5 = Repair(
            complaint_id=c5.id,
            engineer_id=eng_profile_1.id,
            current_stage=RepairStage.CLOSED,
            inspection_remarks="Inspected 2 potholes on lane 1. Depth 7cm.",
            inspection_date=datetime.utcnow() - timedelta(days=8),
            repair_start_date=datetime.utcnow() - timedelta(days=6),
            repair_completion_date=datetime.utcnow() - timedelta(days=3),
            completion_remarks="Full compaction completed with Bituminous Concrete BC Grade 2. Smooth transition verified.",
            repair_after_image=rep_img_5,
            materials_used="BC Grade 2, Hot mix asphalt",
            estimated_cost=15000.0,
            actual_cost=14200.0,
            verified_by_authority_id=auth_user_nhai.id,
            verification_remarks="Quality inspection approved. Leveling within IRC standards. Complaint successfully resolved.",
            verification_date=datetime.utcnow() - timedelta(days=2)
        )
        db.add(rep_5)

        # Complaint 6: Nashik NH-60
        img_url_6 = generate_sample_image("nashik_nh60.jpg", "Pothole")
        ann_url_6 = generate_sample_image("ann_nashik_nh60.jpg", "Pothole", is_annotated=True)
        c6 = Complaint(
            id="RGD-2026-1006",
            citizen_id=citizen_user.id,
            authority_id=auth_nhai.id,
            road_name="Nashik-Pune National Highway (NH-60)",
            road_type=RoadType.NATIONAL_HIGHWAY,
            description="Deep crater near Dwarka Circle causing heavy congestion and heavy vehicle axle risk.",
            latitude=19.9975,
            longitude=73.7898,
            district="Nashik",
            state="Maharashtra",
            landmark="Near Dwarka Flyover Junction",
            image_url=img_url_6,
            status=ComplaintStatus.UNDER_REVIEW,
            priority=PriorityLevel.CRITICAL,
            routing_notes="Auto-routed to NHAI RO Mumbai for NH-60 corridor.",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(c6)
        db.commit()

        ai_6 = AIResult(
            complaint_id=c6.id,
            primary_damage_type=DamageClass.POTHOLE,
            confidence_score=0.95,
            severity=SeverityLevel.CRITICAL,
            damage_count=3,
            detections_json=json.dumps([
                {"bbox": [210.0, 250.0, 590.0, 480.0], "class_name": "Pothole", "confidence": 0.95, "area_percentage": 19.2}
            ]),
            annotated_image_url=ann_url_6,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=105.0
        )
        db.add(ai_6)

        # Complaint 7: Nagpur Wardha Road (State Highway)
        img_url_7 = generate_sample_image("nagpur_sh.jpg", "Transverse Crack")
        ann_url_7 = generate_sample_image("ann_nagpur_sh.jpg", "Transverse Crack", is_annotated=True)
        c7 = Complaint(
            id="RGD-2026-1007",
            citizen_id=citizen2.id,
            authority_id=auth_pwd.id,
            road_name="Nagpur-Wardha Road (SH-258)",
            road_type=RoadType.STATE_HIGHWAY,
            description="Continuous transverse thermal cracks across carriageway near MIHAN entrance.",
            latitude=21.0684,
            longitude=79.0494,
            district="Nagpur",
            state="Maharashtra",
            landmark="Near MIHAN Flyover",
            image_url=img_url_7,
            status=ComplaintStatus.AUTHORITY_ASSIGNED,
            priority=PriorityLevel.MEDIUM,
            routing_notes="Auto-routed to Maharashtra PWD for State Highway.",
            created_at=datetime.utcnow() - timedelta(hours=14)
        )
        db.add(c7)
        db.commit()

        ai_7 = AIResult(
            complaint_id=c7.id,
            primary_damage_type=DamageClass.TRANSVERSE_CRACK,
            confidence_score=0.88,
            severity=SeverityLevel.MEDIUM,
            damage_count=2,
            detections_json=json.dumps([
                {"bbox": [150.0, 220.0, 650.0, 360.0], "class_name": "Transverse Crack", "confidence": 0.88, "area_percentage": 11.5}
            ]),
            annotated_image_url=ann_url_7,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=118.0
        )
        db.add(ai_7)

        # Complaint 8: PMC Pune Karve Road (Municipal Road)
        img_url_8 = generate_sample_image("pune_karve.jpg", "Surface Damage")
        ann_url_8 = generate_sample_image("ann_pune_karve.jpg", "Surface Damage", is_annotated=True)
        c8 = Complaint(
            id="RGD-2026-1008",
            citizen_id=citizen_user.id,
            authority_id=auth_bmc.id,
            road_name="Karve Road (Near Deccan Gymkhana)",
            road_type=RoadType.MUNICIPAL_ROAD,
            description="Extensive bituminous peeling and surface raveling on municipal bus lane.",
            latitude=18.5158,
            longitude=73.8418,
            district="Pune",
            state="Maharashtra",
            landmark="Opp. Garware College Metro Station",
            image_url=img_url_8,
            status=ComplaintStatus.INSPECTION_PENDING,
            priority=PriorityLevel.HIGH,
            routing_notes="Auto-routed to Municipal Road Division.",
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(c8)
        db.commit()

        ai_8 = AIResult(
            complaint_id=c8.id,
            primary_damage_type=DamageClass.SURFACE_DAMAGE,
            confidence_score=0.91,
            severity=SeverityLevel.HIGH,
            damage_count=1,
            detections_json=json.dumps([
                {"bbox": [180.0, 200.0, 600.0, 440.0], "class_name": "Surface Damage", "confidence": 0.91, "area_percentage": 14.0}
            ]),
            annotated_image_url=ann_url_8,
            model_version="YOLOv8n-RoadDamage-v1.0",
            processing_time_ms=102.0
        )
        db.add(ai_8)

        # 5. Add Status History Timeline for complaints
        histories = [
            StatusHistory(complaint_id=c1.id, from_status=None, to_status="Submitted", changed_by_user_id=citizen_user.id, changed_by_role="Citizen", remarks="Complaint submitted with geolocation and photo.", timestamp=datetime.utcnow() - timedelta(days=3)),
            StatusHistory(complaint_id=c1.id, from_status="Submitted", to_status="AI Analyzed", changed_by_user_id=None, changed_by_role="AI System", remarks="YOLOv8 detected 2 defects (Pothole 94%). Severity rated Critical.", timestamp=datetime.utcnow() - timedelta(days=3, minutes=-2)),
            StatusHistory(complaint_id=c1.id, from_status="AI Analyzed", to_status="Authority Assigned", changed_by_user_id=None, changed_by_role="Authority Router", remarks="Auto-routed to NHAI RO Mumbai for National Highway corridor.", timestamp=datetime.utcnow() - timedelta(days=3, minutes=-5)),
            StatusHistory(complaint_id=c1.id, from_status="Authority Assigned", to_status="Engineer Assigned", changed_by_user_id=auth_user_nhai.id, changed_by_role="Authority", remarks="Assigned to Senior Engineer Ramesh Patil (ENG-NHAI-101) for immediate repair.", timestamp=datetime.utcnow() - timedelta(days=2)),
            StatusHistory(complaint_id=c1.id, from_status="Engineer Assigned", to_status="Repair In Progress", changed_by_user_id=eng_user_1.id, changed_by_role="Engineer", remarks="Cold bituminous mix leveling and road cordoning active.", timestamp=datetime.utcnow() - timedelta(days=1)),

            StatusHistory(complaint_id=c5.id, from_status=None, to_status="Submitted", changed_by_user_id=citizen_user.id, changed_by_role="Citizen", remarks="Complaint submitted.", timestamp=datetime.utcnow() - timedelta(days=10)),
            StatusHistory(complaint_id=c5.id, from_status="Submitted", to_status="AI Analyzed", changed_by_user_id=None, changed_by_role="AI System", remarks="AI Detection completed (Pothole 96%).", timestamp=datetime.utcnow() - timedelta(days=10)),
            StatusHistory(complaint_id=c5.id, from_status="AI Analyzed", to_status="Authority Assigned", changed_by_user_id=None, changed_by_role="Authority Router", remarks="Assigned to NHAI.", timestamp=datetime.utcnow() - timedelta(days=10)),
            StatusHistory(complaint_id=c5.id, from_status="Authority Assigned", to_status="Repair Completed", changed_by_user_id=eng_user_1.id, changed_by_role="Engineer", remarks="Bituminous overlay completed and cured.", timestamp=datetime.utcnow() - timedelta(days=3)),
            StatusHistory(complaint_id=c5.id, from_status="Repair Completed", to_status="Closed", changed_by_user_id=auth_user_nhai.id, changed_by_role="Authority", remarks="Work verified and closed by NHAI Officer.", timestamp=datetime.utcnow() - timedelta(days=2)),
        ]
        db.add_all(histories)

        # 6. Add In-App Notifications
        notifications = [
            Notification(user_id=citizen_user.id, complaint_id=c1.id, title="Complaint In Progress", message="Engineer Ramesh Patil is currently carrying out repair work for Western Express Highway.", type=NotificationType.INFO),
            Notification(user_id=citizen_user.id, complaint_id=c5.id, title="Complaint #RGD-2026-1005 Resolved", message="Your road damage complaint on NH-48 has been successfully repaired and closed!", type=NotificationType.SUCCESS),
            Notification(user_id=auth_user_nhai.id, complaint_id=c1.id, title="Critical Highway Defect Assigned", message="New critical pothole reported on Western Express Highway.", type=NotificationType.URGENT),
            Notification(user_id=eng_user_1.id, complaint_id=c1.id, title="New Field Assignment", message="You have been assigned to inspect Western Express Highway defect #RGD-2026-1001.", type=NotificationType.WARNING),
        ]
        db.add_all(notifications)

        db.commit()
        print("--> Seed data inserted successfully with full Maharashtra coverage!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
