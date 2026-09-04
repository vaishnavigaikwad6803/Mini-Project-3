from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.complaint import Complaint, ComplaintStatus, RoadType, PriorityLevel
from app.schemas.complaint import MapComplaintResponse

router = APIRouter(prefix="/maps", tags=["Interactive Map"])

@router.get("/complaints", response_model=List[MapComplaintResponse])
def get_map_complaints(
    road_type: Optional[RoadType] = Query(None),
    status: Optional[ComplaintStatus] = Query(None),
    authority_id: Optional[int] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns sanitized geographic locations and damage markers for the Leaflet interactive map.
    Protects citizen privacy by omitting personal identity details from map payload.
    """
    query = db.query(Complaint)
    if road_type:
        query = query.filter(Complaint.road_type == road_type)
    if status:
        query = query.filter(Complaint.status == status)
    if authority_id:
        query = query.filter(Complaint.authority_id == authority_id)
    if district:
        query = query.filter(Complaint.district.ilike(f"%{district}%"))

    complaints = query.all()
    results = []
    for c in complaints:
        damage_type = c.ai_result.primary_damage_type.value if c.ai_result else "Road Defect"
        auth_name = c.authority.name if c.authority else "Pending Authority Assignment"
        
        eng_id = None
        eng_name = None
        eng_emp_id = None
        eng_phone = None
        eng_email = None
        eng_desig = None
        eng_spec = None
        
        if c.repair and c.repair.engineer:
            eng = c.repair.engineer
            eng_id = eng.id
            eng_emp_id = eng.employee_id
            eng_desig = eng.designation
            eng_spec = eng.specialization
            if eng.user:
                eng_name = eng.user.full_name
                eng_phone = eng.user.phone
                eng_email = eng.user.email
        
        results.append({
            "id": c.id,
            "road_name": c.road_name,
            "road_type": c.road_type,
            "status": c.status,
            "priority": c.priority,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "district": c.district,
            "state": c.state,
            "image_url": c.image_url,
            "damage_type": damage_type,
            "authority_name": auth_name,
            "engineer_id": eng_id,
            "engineer_name": eng_name,
            "engineer_employee_id": eng_emp_id,
            "engineer_phone": eng_phone,
            "engineer_email": eng_email,
            "engineer_designation": eng_desig,
            "engineer_specialization": eng_spec,
            "created_at": c.created_at
        })
    return results
