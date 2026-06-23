from fastapi import APIRouter
from typing import List
from models.schemas import WardDetail
from services.data_loader import get_all_wards
from services.intervention_engine import get_interventions

router = APIRouter()

@router.get("/zones", response_model=List[WardDetail])
def get_zones():
    wards = get_all_wards()
    result = []
    for w in wards:
        risk, interventions = get_interventions(w['heat'], w['ndvi'])
        w['risk'] = risk
        w['interventions'] = interventions
        result.append(w)
    return result

@router.get("/zones/{ward_id}", response_model=WardDetail)
def get_zone_by_id(ward_id: int):
    wards = get_all_wards()
    for w in wards:
        if w['id'] == ward_id:
            risk, interventions = get_interventions(w['heat'], w['ndvi'])
            w['risk'] = risk
            w['interventions'] = interventions
            return w
    return None
