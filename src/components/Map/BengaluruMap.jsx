import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, LayerGroup, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BENGALURU_WARDS, HEAT_POINTS } from '../../data/mockData';
import HeatmapLayer from './HeatmapLayer';
import './BengaluruMap.css';

const { BaseLayer, Overlay } = LayersControl;

export default function BengaluruMap({ wardsData = [], colorMode = 'risk' }) {
  const [activeFeature, setActiveFeature] = useState(null);

  const mapCenter = [12.9716, 77.5946]; // Bangalore center
  const mapZoom = 11;

  // Convert flat ward data to GeoJSON for the choropleth
  const geoJsonData = {
    type: "FeatureCollection",
    features: wardsData.map(w => ({
      type: "Feature",
      properties: { name: w.name, pop: w.pop, heat: w.heat, ndvi: w.ndvi, risk: w.risk, cluster: w.cluster },
      // Generate a small square polygon around lat/lng for visualization
      geometry: {
        type: "Polygon",
        coordinates: [[
          [w.lng - 0.005, w.lat - 0.005],
          [w.lng + 0.005, w.lat - 0.005],
          [w.lng + 0.005, w.lat + 0.005],
          [w.lng - 0.005, w.lat + 0.005],
          [w.lng - 0.005, w.lat - 0.005]
        ]]
      }
    }))
  };

  // Convert to [lat, lng, intensity] for heatmap
  const heatPoints = wardsData.map(w => [w.lat, w.lng, Math.min(1.0, (w.heat - 30) / 20)]);

  // Style for GeoJSON polygons
  const geoJsonStyle = (feature) => {
    let color = '#00e5ff'; // default safe

    if (colorMode === 'cluster') {
      const cluster = feature.properties.cluster;
      if (cluster === 'C0') color = '#ff1744';
      else if (cluster === 'C1') color = '#ff6d00';
      else if (cluster === 'C2') color = '#ffb300';
      else if (cluster === 'C3') color = '#00e676';
    } else {
      const risk = feature.properties.risk;
      if (risk === 'critical') color = '#ff1744';
      else if (risk === 'high') color = '#ff9100';
      else if (risk === 'moderate') color = '#ffea00';
    }

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: color,
      fillOpacity: 0.15
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({ fillOpacity: 0.4, weight: 3 });
        setActiveFeature(feature.properties);
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle({ fillOpacity: 0.15, weight: 2 });
        setActiveFeature(null);
      },
      click: (e) => {
        // Optional: click handler
      }
    });
  };

  return (
    <div className="bengaluru-map-container">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        zoomControl={false}
      >
        <LayersControl position="topright">
          {/* Base Layers */}
          <BaseLayer checked name="Dark Terrain (Stadia)">
            <TileLayer
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </BaseLayer>
          <BaseLayer name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </BaseLayer>

          {/* Overlays */}
          <Overlay checked name="Thermal Heatmap">
            <LayerGroup>
              <HeatmapLayer points={heatPoints} />
            </LayerGroup>
          </Overlay>
          
          <Overlay checked name="Ward Boundaries (Choropleth)">
            <GeoJSON 
              key={wardsData.length}
              data={geoJsonData} 
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          </Overlay>
        </LayersControl>

        {/* Hover Info Panel */}
        {activeFeature && (
          <div className="map-hover-info glass-panel">
            <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>{activeFeature.name}</h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>Risk: <span style={{color: activeFeature.risk === 'critical' ? 'var(--accent-red)' : 'var(--accent-orange)'}}>{activeFeature.risk.toUpperCase()}</span></div>
              <div>LST: <strong>{activeFeature.heat}°C</strong></div>
              <div>NDVI: <strong>{activeFeature.ndvi}</strong></div>
              <div>Pop: {(activeFeature.pop / 1000).toFixed(1)}k</div>
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
}
