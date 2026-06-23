from pydantic import BaseModel
from typing import List

class WardBase(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    heat: float
    ndvi: float
    pop: int

class WardDetail(WardBase):
    risk: str
    interventions: List[str]

class SimulationRequest(BaseModel):
    trees: int
    coolRoofs: int
    evBuses: int
    waterStations: int
    wards: List[str] = []

class SimulationResponse(BaseModel):
    baseline_temp: float
    target_wards: str
    temp_reduction: float
    projection: List[dict]
