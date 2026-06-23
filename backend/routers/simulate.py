from fastapi import APIRouter
from models.schemas import SimulationRequest, SimulationResponse
from services.simulation_model import predict_reduction
from services.data_loader import get_all_wards

router = APIRouter()

@router.post("/simulate", response_model=SimulationResponse)
def simulate_scenario(req: SimulationRequest):
    wards_data = get_all_wards()
    
    # Calculate baseline based on selected wards (fuzzy prefix match)
    if req.wards:
        selected = [w for w in wards_data if any(w['name'].startswith(ward) for ward in req.wards)]
        if selected:
            baseline = sum(w['heat'] for w in selected) / len(selected)
            target_wards_str = ", ".join(req.wards)
        else:
            baseline = sum(w['heat'] for w in wards_data) / len(wards_data)
            target_wards_str = "Citywide Average"
    else:
        baseline = sum(w['heat'] for w in wards_data) / len(wards_data)
        target_wards_str = "Citywide Average"
        
    # Get total 5-year temp drop from ML model
    total_drop_y5 = predict_reduction(req.trees, req.coolRoofs, req.evBuses, req.waterStations)
    
    results = []
    
    for yr in range(6):
        # Progress scales linearly to the Y5 prediction
        y = yr / 5.0
        
        # Temp reduction for this year
        yr_reduction = total_drop_y5 * y
        
        results.append({
            "year": "Now" if yr == 0 else f"Y{yr}",
            "temp": round(baseline - yr_reduction, 2),
            "greenCover": round(0.18 + req.trees * 0.015 * yr, 3),
            "carbonSaved": int(req.evBuses * 120 * yr + req.trees * 50 * yr),
            "livesProtected": int((yr_reduction / 8) * 800000 * yr + 10000)
        })
        
    return SimulationResponse(
        baseline_temp=round(baseline, 2),
        target_wards=target_wards_str,
        temp_reduction=round(total_drop_y5, 2),
        projection=results
    )
