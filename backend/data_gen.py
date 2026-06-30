import os
import pandas as pd
import numpy as np
import urllib.request
import json

# Load environment variables from .env file
for env_path in [".env", "../.env", "backend/.env"]:
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

current_temp = 26.0
API_KEY = os.environ.get("OPENWEATHER_API_KEY")

if API_KEY:
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q=Bengaluru&units=metric&appid={API_KEY}"
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            current_temp = data['main']['temp']
            print(f"Fetched real-time temperature: {current_temp}°C")
    except Exception as e:
        print(f"Failed to fetch temp from API, using default 26.0: {e}")
else:
    print("OPENWEATHER_API_KEY not configured, using default temperature: 26.0°C")

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
    
    # Heat is statically set to current temperature of Bangalore
    base_heat = current_temp
    heat = current_temp + (0.4 - ndvi) * 4.0 # Add some UHI variance based on NDVI
    
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
