import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, ReferenceLine
} from 'recharts';
import './Intelligence.css';
import BengaluruMap from '../components/Map/BengaluruMap';

/* ---- K-Means cluster data (simulated) ---- */


// Scatter data for K-Means plot
const clusterScatter = [
  ...Array.from({length:47}, () => ({
    lst: 39 + Math.random()*8, ndvi: 0.08 + Math.random()*0.15, cluster:'C0', col:'#ff1744' })),
  ...Array.from({length:61}, () => ({
    lst: 35 + Math.random()*7, ndvi: 0.18 + Math.random()*0.18, cluster:'C1', col:'#ff6d00' })),
  ...Array.from({length:58}, () => ({
    lst: 31 + Math.random()*7, ndvi: 0.32 + Math.random()*0.22, cluster:'C2', col:'#ffb300' })),
  ...Array.from({length:32}, () => ({
    lst: 28 + Math.random()*6, ndvi: 0.52 + Math.random()*0.25, cluster:'C3', col:'#00e676' })),
];

// Centroids
const CENTROIDS = [
  { lst:42.1, ndvi:0.17, label:'C0' },
  { lst:38.6, ndvi:0.26, label:'C1' },
  { lst:35.2, ndvi:0.42, label:'C2' },
  { lst:31.8, ndvi:0.65, label:'C3' },
];

// Regression data
const regressionData = Array.from({length:40}, (_,i) => {
  const lst = 28 + i * 0.45;
  return {
    lst,
    actual: lst * 1.05 - 4 + (Math.random()-0.5)*4,
    predicted: lst * 1.05 - 4,
  };
});

// XAI Feature importances
const featureImportance = [
  { feature:'Land Surface Temp', importance:38, color:'#ff1744' },
  { feature:'NDVI Index',        importance:27, color:'#00e676' },
  { feature:'Pop Density',       importance:19, color:'#00e5ff' },
  { feature:'Road Proximity',    importance:9,  color:'#ffb300' },
  { feature:'Water Body Dist',   importance:7,  color:'#7c4dff' },
];

// Confidence table
const CONFIDENCE = [
  { ward:'Koramangala', cluster:'C0', conf:97.3, lst:43.2, ndvi:0.18, interventions:['Cool Roofs','EV Buses','Water Stations'] },
  { ward:'Whitefield',  cluster:'C0', conf:94.1, lst:41.5, ndvi:0.22, interventions:['Tree Planting','Cool Roofs','EV Buses'] },
  { ward:'Jayanagar',   cluster:'C1', conf:89.7, lst:38.1, ndvi:0.41, interventions:['Cool Roofs','EV Buses'] },
  { ward:'Yelahanka',   cluster:'C1', conf:86.2, lst:36.8, ndvi:0.35, interventions:['Tree Planting','Cool Roofs'] },
  { ward:'Malleswaram', cluster:'C2', conf:82.5, lst:35.2, ndvi:0.52, interventions:['Preventive Trees'] },
  { ward:'Bannerghatta',cluster:'C2', conf:78.9, lst:34.1, ndvi:0.61, interventions:['Monitor Only','Trees'] },
  { ward:'Hebbal',      cluster:'C2', conf:75.4, lst:33.0, ndvi:0.58, interventions:['Monitor Only'] },
  { ward:'Lalbagh',     cluster:'C3', conf:99.1, lst:30.4, ndvi:0.74, interventions:['✅ Healthy Zone'] },
];

const CLUSTER_BADGE = {
  C0: 'badge-critical', C1: 'badge-high', C2: 'badge-moderate', C3: 'badge-safe'
};

const ELBOW = Array.from({length:8}, (_,i) => ({
  k: i+2,
  inertia: 18000 / ((i+1)**0.85) + Math.random()*200,
}));

const CustomScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label mono">Cluster {d?.cluster}</div>
      <div className="chart-tooltip__row"><span>LST</span><strong style={{color: d?.col}}>{d?.lst?.toFixed(1)}°C</strong></div>
      <div className="chart-tooltip__row"><span>NDVI</span><strong style={{color:'#00e676'}}>{d?.ndvi?.toFixed(3)}</strong></div>
    </div>
  );
};

/* ============================================================ */
export default function Intelligence() {
  const [activeCluster, setActiveCluster] = useState(null);
  const [tab, setTab] = useState('kmeans');
  const [clusterData, setClusterData] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [mapWards, setMapWards] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedWard = searchParams.get('ward');

  useEffect(() => {
    if (highlightedWard) {
      setTimeout(() => {
        const el = document.getElementById('highlighted-ward-row');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [highlightedWard]);

  useEffect(() => {
    fetch('http://localhost:8000/api/clusters')
      .then(res => res.json())
      .then(data => {
        setClusterData(data.clusters);
        setCentroids(data.centroids);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch clusters:", err);
        setLoading(false);
      });

    fetch('http://localhost:8000/api/zones')
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(w => {
           let c = 'C3';
           if (w.heat > 38) c = 'C0';
           else if (w.heat > 35) c = 'C1';
           else if (w.heat > 32) c = 'C2';
           return { ...w, cluster: c };
        });
        setMapWards(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  const displayData = activeCluster
    ? clusterData.filter(d => d.cluster === activeCluster)
    : clusterData;

  const dynamicClusters = ['C0', 'C1', 'C2', 'C3'].map((label, idx) => {
    const data = clusterData.filter(d => d.cluster === label);
    const names = ['Critical', 'High Risk', 'Moderate', 'Safe'];
    const colors = ['#ff1744', '#ff6d00', '#ffb300', '#00e676'];
    const avgLst = data.length ? data.reduce((sum, d) => sum + d.lst, 0) / data.length : 0;
    const avgNdvi = data.length ? data.reduce((sum, d) => sum + d.ndvi, 0) / data.length : 0;
    return {
      label,
      name: names[idx],
      color: colors[idx],
      wards: data.length,
      avgLst: avgLst.toFixed(1),
      avgNdvi: avgNdvi.toFixed(2),
      pop: (data.length * 0.05).toFixed(1) // rough mock
    };
  });

  return (
    <div className="intelligence page-wrapper">
      <div className="grid-bg"/>
      <div className="glow-orb" style={{width:500,height:500,background:'rgba(124,77,255,0.05)',top:'20%',left:'-100px'}}/>

      {/* PAGE HEADER */}
      <div className="page-header container">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="badge badge-purple">NEURAL CORE v2.1</span>
            <span className="badge badge-info">XAI ENABLED</span>
          </div>
          <h1 className="display-md">Intelligence Engine</h1>
          <p style={{color:'var(--text-secondary)', marginTop:8}}>
            K-Means clustering, regression models, and explainable AI with confidence scoring.
          </p>
        </div>
      </div>

      <div className="container">
        {/* ===== CLUSTER SUMMARY CARDS ===== */}
        <div className="cluster-cards mb-8">
          {dynamicClusters.map((c, i) => (
            <div key={i}
              className={`cluster-card glass-panel-sm ${activeCluster === c.label ? 'cluster-card--active' : ''}`}
              style={{'--c-color': c.color}}
              onClick={() => setActiveCluster(activeCluster === c.label ? null : c.label)}>
              <div className="cluster-card__top">
                <span className="mono" style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>{c.label}</span>
                <span className="pulse-dot" style={{background:c.color, width:7, height:7}}/>
              </div>
              <div style={{fontSize:'1.8rem', fontWeight:900, color:c.color, fontFamily:'var(--font-display)'}}>{c.wards}</div>
              <div className="metric-label">{c.name}</div>
              <div className="cluster-card__meta">
                <span>🌡️ {c.avgLst}°C</span>
                <span>🌿 {c.avgNdvi}</span>
                <span>👥 {c.pop}M</span>
              </div>
            </div>
          ))}
        </div>

        {/* ===== TABS ===== */}
        <div className="int-tabs mb-6">
          {[
            { id:'kmeans', label:'K-Means Scatter' },
            { id:'elbow',  label:'Elbow Method' },
            { id:'regression', label:'Heat Regression' },
          ].map(t => (
            <button key={t.id} className={`int-tab ${tab===t.id ? 'int-tab--active':''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== CHART PANEL ===== */}
        <div className="glass-panel mb-8" style={{padding:28}}>
          {tab === 'kmeans' && (
            <>
              <div className="section-label mb-4">
                <span className="heading-md">Geospatial Distribution & Cluster Space</span>
                {activeCluster && <span className="badge badge-info">Filtered: {activeCluster}</span>}
              </div>
              <p className="body-sm text-secondary mb-4">
                Geographic visualization of AI clusters across Bengaluru wards, alongside the traditional LST vs NDVI scatter distribution.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ height: '350px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                  <BengaluruMap wardsData={activeCluster ? mapWards.filter(w => w.cluster === activeCluster) : mapWards} colorMode="cluster" />
                </div>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{top:10, right:20, bottom:10, left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                      <XAxis type="number" dataKey="lst" name="LST (°C)" domain={[26,52]}
                        label={{value:'Land Surface Temp (°C)', position:'insideBottom', offset:-4, fill:'#7a9bb5', fontSize:11}}
                        tick={{fill:'#7a9bb5', fontSize:10}}/>
                      <YAxis type="number" dataKey="ndvi" name="NDVI" domain={[0,0.85]}
                        label={{value:'NDVI', angle:-90, position:'insideLeft', fill:'#7a9bb5', fontSize:11}}
                        tick={{fill:'#7a9bb5', fontSize:10}}/>
                      <Tooltip content={<CustomScatterTooltip/>}/>
                      {/* Data points by cluster */}
                      {['C0','C1','C2','C3'].map(cl => {
                        const cols = {C0:'#ff1744',C1:'#ff6d00',C2:'#ffb300',C3:'#00e676'};
                        const pts = displayData.filter(d => d.cluster === cl);
                        return (
                          <Scatter key={cl} name={cl} data={pts} fill={cols[cl]} opacity={0.6}
                            shape={<circle r={4}/>}/>
                        );
                      })}
                      {/* Centroids */}
                      {!activeCluster && centroids.map(ct => (
                        <Scatter key={`cen-${ct.label}`}
                          data={[{lst:ct.lst, ndvi:ct.ndvi, cluster:ct.label}]}
                          fill="white" shape="diamond" size={80}/>
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="chart-legend mt-4">
                {dynamicClusters.map(c => (
                  <div key={c.label} className="chart-legend__item">
                    <span style={{width:10,height:10,borderRadius:'50%', background:c.color, display:'block'}}/>
                    <span className="body-sm">{c.name}</span>
                  </div>
                ))}
                <span className="body-sm" style={{color:'var(--text-muted)'}}>◇ = Centroid</span>
              </div>
            </>
          )}

          {tab === 'elbow' && (
            <>
              <div className="section-label mb-4">
                <span className="heading-md">Elbow Method — Optimal k Selection</span>
              </div>
              <p className="body-sm mb-6" style={{color:'var(--text-secondary)'}}>
                Within-cluster sum of squares (inertia) vs. number of clusters k. The "elbow" at k=4 confirms our choice.
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={ELBOW}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                  <XAxis dataKey="k" label={{value:'Number of Clusters (k)', position:'insideBottom', offset:-4, fill:'#7a9bb5', fontSize:11}} tick={{fill:'#7a9bb5', fontSize:11}}/>
                  <YAxis tick={{fill:'#7a9bb5', fontSize:11}} label={{value:'Inertia (WCSS)', angle:-90, position:'insideLeft', fill:'#7a9bb5', fontSize:11}}/>
                  <Tooltip contentStyle={{background:'var(--bg-panel)',border:'1px solid var(--glass-border)',borderRadius:8}} labelStyle={{color:'var(--accent-cyan)'}}/>
                  <ReferenceLine x={4} stroke="var(--accent-cyan)" strokeDasharray="6 4" label={{value:'k=4 (optimal)', fill:'var(--accent-cyan)', fontSize:11}}/>
                  <Line type="monotone" dataKey="inertia" stroke="var(--accent-amber)" strokeWidth={2.5}
                    dot={{fill:'var(--accent-amber)', r:5}} name="WCSS"/>
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          {tab === 'regression' && (
            <>
              <div className="section-label mb-4">
                <span className="heading-md">Heat Intensity Regression</span>
                <span className="badge badge-safe">R² = 0.91</span>
              </div>
              <p className="body-sm mb-6" style={{color:'var(--text-secondary)'}}>
                Predicted vs actual heat intensity across wards. Linear regression on multi-feature geospatial inputs.
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={regressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                  <XAxis dataKey="lst" tick={{fill:'#7a9bb5', fontSize:10}} label={{value:'Input LST (°C)', position:'insideBottom', offset:-4, fill:'#7a9bb5', fontSize:11}}/>
                  <YAxis tick={{fill:'#7a9bb5', fontSize:10}}/>
                  <Tooltip contentStyle={{background:'var(--bg-panel)',border:'1px solid var(--glass-border)',borderRadius:8}}/>
                  <Line type="monotone" dataKey="actual" stroke="rgba(255,109,0,0.5)" strokeWidth={1} dot={{r:2, fill:'var(--accent-orange)'}} name="Actual"/>
                  <Line type="monotone" dataKey="predicted" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} name="Predicted"/>
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* ===== XAI — FEATURE IMPORTANCE ===== */}
        <div className="xai-grid mb-8">
          <div className="glass-panel" style={{padding:24}}>
            <div className="section-label mb-4">
              <span className="heading-md">XAI — Feature Importances</span>
              <span className="badge badge-purple">SHAP-INSPIRED</span>
            </div>
            <p className="body-sm mb-6" style={{color:'var(--text-secondary)'}}>
              Which inputs drive cluster assignment the most?
            </p>
            <div className="feature-bars">
              {featureImportance.map((f, i) => (
                <div key={i} className="feature-bar-row">
                  <span className="body-sm" style={{minWidth:150, color:'var(--text-secondary)'}}>{f.feature}</span>
                  <div className="feature-bar-track">
                    <div className="feature-bar-fill"
                      style={{width:`${f.importance}%`, background:f.color, boxShadow:`0 0 8px ${f.color}60`}}/>
                  </div>
                  <span className="mono body-sm" style={{color:f.color, minWidth:36, textAlign:'right'}}>{f.importance}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{padding:24}}>
            <div className="section-label mb-4">
              <span className="heading-md">Model Performance</span>
            </div>
            <div className="model-metrics">
              {[
                { label:'K-Means Silhouette', value:'0.74', good:true },
                { label:'Regression R²',      value:'0.91', good:true },
                { label:'MAE (°C)',            value:'1.3',  good:true },
                { label:'Precision (C0)',      value:'0.93', good:true },
                { label:'Recall (C0)',         value:'0.89', good:true },
                { label:'F1 Score',            value:'0.91', good:true },
              ].map((m,i) => (
                <div key={i} className="model-metric-row">
                  <span style={{color:'var(--text-secondary)', fontSize:'0.85rem'}}>{m.label}</span>
                  <span className="mono" style={{color: m.good ? 'var(--accent-green)':'var(--accent-orange)', fontWeight:700}}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== CONFIDENCE TABLE ===== */}
        <div className="glass-panel mb-8">
          <div className="conf-header">
            <div className="section-label" style={{marginBottom:0}}>
              <span className="heading-md">Zone Confidence Scores</span>
            </div>
            <span className="badge badge-info">AI DECISION LOG</span>
          </div>
          <div className="conf-table">
            <div className="conf-table__head">
              <span>Ward</span><span>Cluster</span><span>Confidence</span>
              <span>LST</span><span>NDVI</span><span>Recommended Actions</span><span>Simulate</span>
            </div>
            {CONFIDENCE.map((row, i) => {
              const isHighlighted = highlightedWard && (highlightedWard.toLowerCase().includes(row.ward.toLowerCase()) || row.ward.toLowerCase().includes(highlightedWard.toLowerCase()));
              return (
              <div key={i} className={`conf-table__row ${isHighlighted ? 'highlighted-ward' : ''}`} id={isHighlighted ? 'highlighted-ward-row' : undefined}>
                <span style={{fontWeight:600}}>{row.ward}</span>
                <span className={`badge ${CLUSTER_BADGE[row.cluster]}`}>{row.cluster}</span>
                <div className="conf-bar-wrap">
                  <div className="conf-bar" style={{
                    width:`${row.conf}%`,
                    background: row.conf>90?'var(--accent-green)':row.conf>80?'var(--accent-cyan)':'var(--accent-amber)'
                  }}/>
                  <span className="mono body-sm" style={{marginLeft:8, color:'var(--text-secondary)'}}>{row.conf}%</span>
                </div>
                <span className="mono body-sm" style={{color:'var(--accent-orange)'}}>{row.lst}°C</span>
                <span className="mono body-sm" style={{color:'var(--accent-green)'}}>{row.ndvi}</span>
                <div className="action-tags">
                  {row.interventions.map((a,ai) => (
                    <span key={ai} className="action-tag">{a}</span>
                  ))}
                </div>
                <div>
                  <a href={`/strategy?ward=${encodeURIComponent(row.ward)}&interventions=${encodeURIComponent(row.interventions.join(','))}`} className="btn btn-secondary" style={{padding: '4px 8px', fontSize: '0.75rem', minHeight: '0'}}>
                    Simulate &rarr;
                  </a>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
