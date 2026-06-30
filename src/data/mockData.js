// A simple mock GeoJSON for Bengaluru wards (approximate center ~12.97, 77.59)
export const BENGALURU_WARDS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Koramangala", pop: 120000, heat: 26.0, ndvi: 0.18, risk: "critical" },
      geometry: { type: "Polygon", coordinates: [[[77.620, 12.930], [77.635, 12.930], [77.635, 12.945], [77.620, 12.945], [77.620, 12.930]]] }
    },
    {
      type: "Feature",
      properties: { name: "Whitefield", pop: 95000, heat: 26.0, ndvi: 0.22, risk: "critical" },
      geometry: { type: "Polygon", coordinates: [[[77.740, 12.960], [77.760, 12.960], [77.760, 12.975], [77.740, 12.975], [77.740, 12.960]]] }
    },
    {
      type: "Feature",
      properties: { name: "Jayanagar", pop: 88000, heat: 26.0, ndvi: 0.41, risk: "high" },
      geometry: { type: "Polygon", coordinates: [[[77.570, 12.920], [77.590, 12.920], [77.590, 12.935], [77.570, 12.935], [77.570, 12.920]]] }
    },
    {
      type: "Feature",
      properties: { name: "Yelahanka", pop: 74000, heat: 26.0, ndvi: 0.35, risk: "high" },
      geometry: { type: "Polygon", coordinates: [[[77.580, 13.090], [77.600, 13.090], [77.600, 13.110], [77.580, 13.110], [77.580, 13.090]]] }
    },
    {
      type: "Feature",
      properties: { name: "Malleswaram", pop: 65000, heat: 26.0, ndvi: 0.52, risk: "moderate" },
      geometry: { type: "Polygon", coordinates: [[[77.560, 12.990], [77.575, 12.990], [77.575, 13.010], [77.560, 13.010], [77.560, 12.990]]] }
    },
    {
      type: "Feature",
      properties: { name: "Hebbal", pop: 48000, heat: 26.0, ndvi: 0.58, risk: "moderate" },
      geometry: { type: "Polygon", coordinates: [[[77.585, 13.030], [77.605, 13.030], [77.605, 13.045], [77.585, 13.045], [77.585, 13.030]]] }
    }
  ]
};

// Generate some random points for the heatmap
export const HEAT_POINTS = [];
for (let i = 0; i < 500; i++) {
  const lat = 12.9 + Math.random() * 0.2;
  const lng = 77.5 + Math.random() * 0.25;
  const intensity = Math.random(); // 0 to 1
  HEAT_POINTS.push([lat, lng, intensity]);
}
