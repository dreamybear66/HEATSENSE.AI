import React from 'react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import './Network.css';

/* ---- Data Sources & Integrity Data ---- */
const DATA_SOURCES = [
  { id: 'MODIS-LST', name: 'NASA MODIS (MOD11A1)', type: 'Land Surface Temp', resolution: '1 km', lastPulled: new Date(Date.now() - 1000*60*60*4).toLocaleString(), status: 'verified', syncCycle: 'Daily' },
  { id: 'SEN2-NDVI', name: 'ESA Sentinel-2', type: 'Vegetation Index', resolution: '10 m', lastPulled: new Date(Date.now() - 1000*60*60*48).toLocaleString(), status: 'verified', syncCycle: '5 Days' },
  { id: 'BBMP-GEO', name: 'BBMP Open Data', type: 'Ward Boundaries', resolution: 'Vector (Polygon)', lastPulled: '2023-01-10 00:00:00', status: 'static', syncCycle: 'Yearly' },
  { id: 'CENSUS-IND', name: 'India Census (Projected)', type: 'Population Density', resolution: 'Ward-level', lastPulled: '2023-01-01 00:00:00', status: 'static', syncCycle: 'Decadal' },
];

const DATA_QUALITY = [
  { metric: 'LST Coverage', coverage: 98.5 },
  { metric: 'NDVI Completeness', coverage: 99.1 },
  { metric: 'Ward Boundary Alignment', coverage: 100 },
  { metric: 'Demographic Sync', coverage: 95.5 },
  { metric: 'Cloud-Free Pixels', coverage: 92.4 },
];

const PIPELINE_LATENCY = [
  { stage: 'Ingestion', timeMs: 450 },
  { stage: 'Cleaning', timeMs: 1200 },
  { stage: 'Geo-Join', timeMs: 850 },
  { stage: 'K-Means Prep', timeMs: 320 },
];

const StatusBadge = ({status}) => {
  const colors = { verified:'var(--accent-green)', static:'var(--accent-cyan)', warning:'var(--accent-orange)' };
  return (
    <span style={{color: colors[status] || 'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em', border:`1px solid ${colors[status]}50`, padding:'2px 6px', borderRadius:'4px'}}>
      {status}
    </span>
  );
};

/* ============================================================ */
export default function Network() {
  return (
    <div className="network page-wrapper">
      <div className="grid-bg"/>
      <div className="glow-orb" style={{width:600,height:600, background:'rgba(0,229,255,0.03)', top:'10%', right:'-150px'}}/>

      {/* ===== PAGE HEADER ===== */}
      <div className="page-header container">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="badge badge-info">DATA INTEGRITY</span>
            <span className="badge badge-safe">PIPELINE VERIFIED</span>
          </div>
          <h1 className="display-md">Data Sources & Transparency</h1>
          <p style={{color:'var(--text-secondary)', marginTop:8, maxWidth:600}}>
            A transparent overview of the datasets, pipeline latency, and spatial integrity metrics powering the Thermal Mind engine.
          </p>
        </div>
        <div className="page-header__stats">
          <div className="metric-card" style={{minWidth:140}}>
            <div className="metric-value" style={{color:'var(--accent-green)'}}>{DATA_SOURCES.length}</div>
            <div className="metric-label">Active Sources</div>
          </div>
          <div className="metric-card" style={{minWidth:140}}>
            <div className="metric-value" style={{color:'var(--accent-cyan)'}}>98.5%</div>
            <div className="metric-label">Avg Completeness</div>
          </div>
          <div className="metric-card" style={{minWidth:140}}>
            <div className="metric-value" style={{color:'var(--accent-amber)'}}>2.8s</div>
            <div className="metric-label">Pipeline Latency</div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* ===== SATELLITE & DATA SOURCES TABLE ===== */}
        <div className="glass-panel mb-8">
          <div className="sat-table-header" style={{padding:'24px 24px 16px', borderBottom:'1px solid var(--glass-border)'}}>
            <div className="section-label" style={{marginBottom:0}}>
              <span className="heading-md">Primary Datasets & Freshness</span>
            </div>
          </div>
          <div className="sat-table" style={{padding:'0 24px 24px'}}>
            <div className="sat-table__head" style={{display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr 1fr 1.5fr 0.5fr', padding:'12px 0', borderBottom:'1px solid var(--glass-border)', color:'var(--text-muted)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px'}}>
              <span>Provider ID</span><span>Dataset Name</span><span>Variable</span>
              <span>Resolution</span><span>Last Pulled (UTC)</span><span>Status</span>
            </div>
            {DATA_SOURCES.map(s => (
              <div key={s.id} style={{display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr 1fr 1.5fr 0.5fr', padding:'12px 0', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
                <span className="mono" style={{color:'var(--accent-cyan)'}}>{s.id}</span>
                <span style={{fontWeight:500, color:'var(--text-primary)'}}>{s.name}</span>
                <span className="body-sm" style={{color:'var(--text-secondary)'}}>{s.type}</span>
                <span className="mono body-sm" style={{color:'var(--text-secondary)'}}>{s.resolution}</span>
                <span className="mono body-sm" style={{color:'var(--text-secondary)'}}>{s.lastPulled}</span>
                <div><StatusBadge status={s.status}/></div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid-2 mb-8">
          {/* ===== DATA QUALITY RADAR ===== */}
          <div className="glass-panel" style={{padding:24}}>
            <div className="section-label mb-4">
              <span className="heading-md">Spatial Integrity Metrics</span>
            </div>
            <p className="body-sm mb-6" style={{color:'var(--text-secondary)'}}>Validating alignment between raster (satellite) and vector (ward) boundaries.</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={DATA_QUALITY}>
                <PolarGrid stroke="rgba(0,229,255,0.1)"/>
                <PolarAngleAxis dataKey="metric" tick={{fill:'#7a9bb5', fontSize:10}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:'#7a9bb5', fontSize:8}}/>
                <Radar name="Coverage %" dataKey="coverage"
                  stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.15}
                  dot={{fill:'var(--accent-cyan)', r:3}}/>
                <Tooltip contentStyle={{background:'var(--bg-panel)', border:'1px solid var(--glass-border)', borderRadius:8}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* ===== PIPELINE LATENCY ===== */}
          <div className="glass-panel" style={{padding:24}}>
            <div className="section-label mb-4">
              <span className="heading-md">ETL Pipeline Latency</span>
            </div>
            <p className="body-sm mb-6" style={{color:'var(--text-secondary)'}}>Processing time across Extract, Transform, and Load stages.</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={PIPELINE_LATENCY} layout="vertical" margin={{top:0, right:30, left:40, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" horizontal={true} vertical={false}/>
                <XAxis type="number" tick={{fill:'#7a9bb5', fontSize:10}} unit="ms"/>
                <YAxis dataKey="stage" type="category" tick={{fill:'#7a9bb5', fontSize:11}}/>
                <Tooltip contentStyle={{background:'var(--bg-panel)', border:'1px solid var(--glass-border)', borderRadius:8}} cursor={{fill:'rgba(0,229,255,0.05)'}}/>
                <Bar dataKey="timeMs" fill="var(--accent-cyan)" radius={[0,4,4,0]} barSize={24} name="Processing Time (ms)"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
