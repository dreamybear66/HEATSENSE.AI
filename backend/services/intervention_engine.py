def get_interventions(heat: float, ndvi: float):
    """
    2x2 Matrix Rule Engine
    High Heat (> 38), Low Green (< 0.3)
    """
    interventions = []
    
    heat_high = heat > 38.0
    green_low = ndvi < 0.3
    
    if heat_high and green_low:
        risk = "critical"
        interventions = ["Tree Planting", "Cool Roofs", "EV Buses", "Water Stations"]
    elif heat_high and not green_low:
        risk = "high"
        interventions = ["Cool Roofs", "EV Buses", "Water Stations"]
    elif not heat_high and green_low:
        risk = "moderate"
        interventions = ["Preventive Tree Planting"]
    else:
        risk = "safe"
        interventions = ["Monitor Only"]
        
    return risk, interventions
