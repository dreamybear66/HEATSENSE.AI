import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

# Generate grounded synthetic data based on UHI mitigation literature
# Assuming 100% implementation yields max literature-supported drops:
# Trees: ~2.0C max drop
# Cool Roofs: ~1.5C max drop
# EV Buses: ~0.5C max drop (via reduced anthropogenic heat)
# Water Stations / features: ~0.8C max drop

def _build_model():
    np.random.seed(42)
    
    # Generate 1000 random scenarios
    # Features: trees_pct, roofs_pct, ev_pct, water_pct (0 to 100)
    X = np.random.uniform(0, 100, size=(1000, 4))
    
    # Calculate target (temperature drop) with some noise
    # Base formula based on literature max drops
    y = (
        (X[:, 0] / 100) * 2.0 +
        (X[:, 1] / 100) * 1.5 +
        (X[:, 2] / 100) * 0.5 +
        (X[:, 3] / 100) * 0.8
    )
    
    # Add non-linear interactions (e.g., trees + water creates synergistic cooling)
    synergy = (X[:, 0] / 100) * (X[:, 3] / 100) * 0.5
    y += synergy
    
    # Add noise to make it realistic
    noise = np.random.normal(0, 0.1, size=1000)
    y += noise
    
    df = pd.DataFrame(X, columns=['trees', 'coolRoofs', 'evBuses', 'waterStations'])
    
    model = LinearRegression()
    model.fit(df, y)
    
    return model

# Train model once when module loads
_sim_model = _build_model()

def predict_reduction(trees: int, coolRoofs: int, evBuses: int, waterStations: int) -> float:
    """Predicts temperature reduction in °C using the trained ML model."""
    df_input = pd.DataFrame([[trees, coolRoofs, evBuses, waterStations]], 
                            columns=['trees', 'coolRoofs', 'evBuses', 'waterStations'])
    
    prediction = _sim_model.predict(df_input)[0]
    return max(0, prediction) # Ensure drop is not negative
