from typing import List, Dict, Any
from pydantic import BaseModel

class AdminDashboardStats(BaseModel):
    total_users: int
    total_complaints: int
    pending_complaints: int
    active_repairs: int
    completed_repairs: int
    total_authorities: int
    total_engineers: int
    avg_ai_confidence: float

class RoadTypeDistribution(BaseModel):
    name: str
    count: int
    percentage: float

class DamageTypeDistribution(BaseModel):
    name: str
    count: int
    percentage: float

class StatusDistribution(BaseModel):
    name: str
    count: int

class DistrictDistribution(BaseModel):
    district: str
    count: int

class MonthlyTrend(BaseModel):
    month: str
    complaints: int
    resolved: int

class AuthorityPerformance(BaseModel):
    authority_name: str
    authority_type: str
    total_assigned: int
    completed: int
    in_progress: int
    avg_resolution_days: float

class AdminAnalyticsData(BaseModel):
    stats: AdminDashboardStats
    road_type_distribution: List[RoadTypeDistribution]
    damage_type_distribution: List[DamageTypeDistribution]
    status_distribution: List[StatusDistribution]
    district_distribution: List[DistrictDistribution]
    monthly_trends: List[MonthlyTrend]
    authority_performance: List[AuthorityPerformance]
