import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create the heatmap layer
    // points should be an array of [lat, lng, intensity]
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 13,
      max: 1.0,
      gradient: {
        0.4: '#00e5ff', // Safe
        0.6: '#76ff03',
        0.7: '#ffea00',
        0.8: '#ff9100', // High risk
        1.0: '#ff1744'  // Critical
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}
