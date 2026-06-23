from fastapi import APIRouter
from services.data_loader import get_all_wards
from sklearn.cluster import KMeans
import numpy as np

router = APIRouter()

@router.get("/clusters")
def get_clusters():
    wards = get_all_wards()
    
    # Extract features for clustering: [LST, NDVI, Population Density proxy]
    features = []
    for w in wards:
        features.append([w['heat'], w['ndvi'], w['pop'] / 10000.0])
        
    X = np.array(features)
    
    # Run K-Means
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X)
    
    # Map back to wards
    results = []
    for i, w in enumerate(wards):
        # Determine risk based on centroid heat to map properly (simplified for mock)
        label = int(labels[i])
        
        results.append({
            "ward_id": w['id'],
            "ward_name": w['name'],
            "cluster": f"C{label}",
            "lst": w['heat'],
            "ndvi": w['ndvi'],
            "col": {0: '#ff1744', 1: '#ff6d00', 2: '#ffb300', 3: '#00e676'}.get(label, '#ffffff')
        })
        
    return {"clusters": results, "centroids": [{"lst": c[0], "ndvi": c[1], "label": f"C{i}"} for i, c in enumerate(kmeans.cluster_centers_.tolist())]}
