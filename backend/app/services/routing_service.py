from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.authority import Authority, AuthorityType
from app.models.complaint import RoadType

ROAD_TYPE_TO_AUTHORITY_TYPE = {
    RoadType.NATIONAL_HIGHWAY: AuthorityType.NATIONAL_HIGHWAY,
    RoadType.STATE_HIGHWAY: AuthorityType.STATE_HIGHWAY,
    RoadType.MUNICIPAL_ROAD: AuthorityType.MUNICIPAL,
    RoadType.RURAL_ROAD: AuthorityType.RURAL_ROAD,
}

def determine_responsible_authority(
    db: Session,
    road_type: RoadType,
    district: str,
    state: str
) -> Tuple[Optional[Authority], str]:
    """
    Intelligently routes a road damage complaint to the appropriate configured Authority
    based on Road Type and Geographic Location (District / State).
    """
    target_authority_type = ROAD_TYPE_TO_AUTHORITY_TYPE.get(road_type)
    
    # 1. First priority: Exact match by Authority Type AND District AND State
    authority = db.query(Authority).filter(
        Authority.authority_type == target_authority_type,
        Authority.district.ilike(f"%{district}%"),
        Authority.state.ilike(f"%{state}%"),
        Authority.is_active == True
    ).first()
    
    if authority:
        return authority, f"Auto-routed to regional {authority.name} for {district}, {state} ({road_type.value})"

    # 2. Second priority: Match by Authority Type AND State
    authority = db.query(Authority).filter(
        Authority.authority_type == target_authority_type,
        Authority.state.ilike(f"%{state}%"),
        Authority.is_active == True
    ).first()
    
    if authority:
        return authority, f"Auto-routed to state-level {authority.name} for {state} ({road_type.value})"

    # 3. Third priority: Match by road_type_coverage substring
    authority = db.query(Authority).filter(
        Authority.road_type_coverage.ilike(f"%{road_type.value}%"),
        Authority.is_active == True
    ).first()
    
    if authority:
        return authority, f"Auto-routed to {authority.name} covering {road_type.value}"

    # 4. Fallback: Any active authority
    fallback = db.query(Authority).filter(Authority.is_active == True).first()
    if fallback:
        return fallback, f"Assigned to default authority {fallback.name} (Requires Admin Verification)"

    return None, "No active authority registered in the system. Pending Admin assignment."
