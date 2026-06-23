import os
import pandas as pd
import numpy as np

# Create data directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Generate 198 wards for Bengaluru
np.random.seed(42)

wards = []
names = [
    "Koramangala", "Whitefield", "Jayanagar", "Yelahanka", "Malleswaram",
    "Bannerghatta", "Hebbal", "Lalbagh", "BTM Layout", "HSR Layout",
    "Electronic City", "Marathahalli", "Indiranagar", "Rajajinagar", "Basavanagudi"
]

for i in range(1, 199):
    # Pick a random base name and append sector/ward number to make it unique
    base_name = np.random.choice(names)
    name = f"{base_name} Ward {i}"
    
    # Generate realistic lat/lng around Bengaluru
    lat = 12.9 + np.random.normal(0, 0.05)
    lng = 77.5 + np.random.normal(0, 0.05)
    
    # Generate heat and ndvi with inverse correlation
    ndvi = max(0.05, min(0.85, np.random.normal(0.35, 0.2)))
    
    # Heat is inversely proportional to NDVI
    base_heat = 45.0 - (ndvi * 15.0)
    heat = max(28.0, min(48.0, np.random.normal(base_heat, 2.0)))
    
    # Population density is higher in hotter/less green areas generally
    pop_density = max(10000, int(np.random.normal(80000 - (ndvi * 50000), 15000)))
    
    wards.append({
        "id": i,
        "name": name,
        "lat": round(lat, 4),
        "lng": round(lng, 4),
        "heat": round(heat, 1),
        "ndvi": round(ndvi, 3),
        "pop": pop_density
    })

df = pd.DataFrame(wards)
df.to_csv('data/bengaluru_wards_data.csv', index=False)
print("Generated data/bengaluru_wards_data.csv with 198 wards.")
