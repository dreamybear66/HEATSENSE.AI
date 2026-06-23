from fastapi import APIRouter
from models.schemas import SimulationRequest

router = APIRouter()

@router.post("/simulate")
def simulate_scenario(req: SimulationRequest):
    baseline = 42.1
    results = []
    
    for yr in range(6):
        y = yr
        treeEffect    = req.trees     * 0.08 * y
        roofEffect    = req.coolRoofs * 0.06 * y
        evEffect      = req.evBuses   * 0.04 * y
        waterEffect   = req.waterStations * 0.025 * y
        
        totalReduction = min(treeEffect + roofEffect + evEffect + waterEffect, 8)
        
        results.append({
            "year": "Now" if yr == 0 else f"Y{yr}",
            "temp": round(baseline - totalReduction, 2),
            "greenCover": round(0.18 + req.trees * 0.015 * y, 3),
            "carbonSaved": int(req.evBuses * 120 * y + req.trees * 50 * y),
            "livesProtected": int((totalReduction / 8) * 800000 * y + 10000)
        })
        
    return {"projection": results}
