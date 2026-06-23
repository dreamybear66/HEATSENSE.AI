import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import './Network.css';

/* ---- Synthetic data ---- */
const CITIES = [
  { id:1, name:'Bengaluru', country:'IN', lat:12.97, lng:77.59, status:'online', satellites:7, albedo:0.19, heat:41.2, nodes:198 },
  { id:2, name:'Delhi',     country:'IN', lat:28.70, lng:77.10, status:'online', satellites:9, albedo:0.17, heat:46.8, nodes:272 },
  { id:3, name:'Chennai',   country:'IN', lat:13.08, lng:80.27, status:'online', satellites:6, albedo:0.21, heat:39.5, nodes:155 },
  { id:4, name:'Mumbai',    country:'IN', lat:19.07, lng:72.87, status:'syncing', satellites:5, albedo:0.23, heat:38.1, nodes:227 },
  { id:5, name:'Kolkata',   country:'IN', lat:22.57, lng:88.36, status:'online', satellites:4, albedo:0.22, heat:37.4, nodes:141 },
  { id:6, name:'Hyderabad', country:'IN', lat:17.39, lng:78.49, status:'online', satellites:6, albedo:0.20, heat:40.3, nodes:176 },
  { id:7, name:'Pune',      country:'IN', lat:18.52, lng:73.86, status:'warning', satellites:3, albedo:0.25, heat:36.7, nodes:128 },
  { id:8, name:'Ahmedabad', country:'IN', lat:23.02, lng:72.57, status:'online', satellites:5, albedo:0.18, heat:43.9, nodes:152 },
];

const SATELLITES = [
  { id:'MOD-01', type:'MODIS TERRA',  orbit:'Sun-sync', refresh:'2h',  status:'active',  signal:97 },
  { id:'SEN-2A', type:'Sentinel-2A',  orbit:'Polar',    refresh:'10d', status:'active',  signal:99 },
  { id:'SEN-2B', type:'Sentinel-2B',  orbit:'Polar',    refresh:'10d', status:'active',  signal:98 },
  { id:'LND-08', type:'Landsat 8',    orbit:'Sun-sync', refresh:'16d', status:'active',  signal:94 },
  { id:'LND-09', type:'Landsat 9',    orbit:'Sun-sync', refresh:'16d', status:'syncing', signal:81 },
  { id:'MOD-02', type:'MODIS AQUA',   orbit:'Sun-sync', refresh:'2h',  status:'active',  signal:96 },
  { id:'INSAT3', type:'INSAT-3D',     orbit:'GEO',      refresh:'30m', status:'active',  signal:88 },
];

const syntheticSignal = Array.from({length:30}, (_,i) => ({
  t:   i,
  sat1: 95 + Math.sin(i*0.5)*3 + Math.random()*2,
  sat2: 92 + Math.cos(i*0.4)*4 + Math.random()*2,
  sat3: 88 + Math.sin(i*0.6+1)*5 + Math.random()*3,
}));

const albedoData = CITIES.map(c => ({ city: c.name.slice(0,3).toUpperCase(), albedo: c.albedo, heat: c.heat }));

const radarData = [
  { metric:'LST Accuracy', value:94 },
  { metric:'NDVI Coverage', value:87 },
  { metric:'Population Sync', value:78 },
  { metric:'Road Network', value:91 },
  { metric:'Ward Bounds', value:99 },
  { metric:'Water Bodies', value:82 },
];

/* ---- SVG Global Network Map ---- */
function GlobalMap({ cities, selected, onSelect }) {
  // Simplified Mercator-ish projection for India bounds
  const W = 700, H = 340;
  const minLat = 8, maxLat = 37, minLng = 68, maxLng = 97;
  const toX = lng => ((lng - minLng) / (maxLng - minLng)) * (W - 80) + 40;
  const toY = lat => ((maxLat - lat) / (maxLat - minLat)) * (H - 60) + 30;

  const STATUS_COLOR = { online:'#00e676', syncing:'#ffb300', warning:'#ff6d00', offline:'#ff1744' };

  return (
    <div className="global-map">
      <div className="global-map__header">
        <span className="label" style={{color:'var(--accent-cyan)'}}>⬡ THERMAL NETWORK — INDIA GRID</span>
        <div className="flex items-center gap-4">
          <span className="pulse-dot pulse-dot-green"/>
          <span className="label" style={{color:'var(--accent-green)'}}>8 CITIES ONLINE</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="global-map__svg">
        {/* Grid */}
        {Array.from({length:10}, (_,i) => (
          <line key={`g${i}`} x1={toX(68+i*3)} y1={25} x2={toX(68+i*3)} y2={H-20}
            stroke="rgba(0,229,255,0.04)" strokeWidth="1"/>
        ))}
        {Array.from({length:7}, (_,i) => (
          <line key={`h${i}`} x1={35} y1={toY(8+i*4.5)} x2={W-35} y2={toY(8+i*4.5)}
            stroke="rgba(0,229,255,0.04)" strokeWidth="1"/>
        ))}

        {/* Connection lines */}
        {cities.map((c, ci) =>
          cities.slice(ci+1).map((c2, c2i) => {
            const d = Math.hypot(toX(c.lng)-toX(c2.lng), toY(c.lat)-toY(c2.lat));
            if (d > 200) return null;
            return (
              <line key={`${c.id}-${c2.id}`}
                x1={toX(c.lng)} y1={toY(c.lat)}
                x2={toX(c2.lng)} y2={toY(c2.lat)}
                stroke="rgba(0,229,255,0.12)" strokeWidth="1"
                strokeDasharray="4 6"
              />
            );
          })
        )}

        {/* Cities */}
        {cities.map(c => {
          const x = toX(c.lng), y = toY(c.lat);
          const col = STATUS_COLOR[c.status];
          const sel = selected === c.id;
          return (
            <g key={c.id} style={{cursor:'pointer'}} onClick={() => onSelect(c.id)}>
              <circle cx={x} cy={y} r={sel?28:20} fill={col} opacity={0.06}/>
              <circle cx={x} cy={y} r={sel?14:10} fill={col} opacity={0.2}
                stroke={col} strokeWidth={sel?2:1.5}/>
              <circle cx={x} cy={y} r={sel?7:5} fill={col} opacity={sel?1:0.9}/>
              <text x={x} y={y+22} textAnchor="middle" fill={col}
                fontSize="10" fontFamily="var(--font-body)" fontWeight="600">
                {c.name}
              </text>
              <text x={x} y={y+34} textAnchor="middle" fill="#7a9bb5"
                fontSize="8" fontFamily="var(--font-mono)">
                {c.heat}°C
              </text>
            </g>
          );
        })}

        {/* Satellite sweep lines from top */}
        <line x1={toX(77.59)} y1={-10} x2={toX(77.59)} y2={toY(12.97)}
          stroke="rgba(0,229,255,0.3)" strokeWidth="1" strokeDasharray="2 6"
          className="sat-beam"/>
        <line x1={toX(77.10)} y1={-10} x2={toX(77.10)} y2={toY(28.70)}
          stroke="rgba(0,229,255,0.2)" strokeWidth="1" strokeDasharray="2 6"
          className="sat-beam" style={{animationDelay:'0.5s'}}/>
      </svg>
    </div>
  );
}

const StatusPill = ({status}) => {
  const colors = { active:'var(--accent-green)', syncing:'var(--accent-amber)', warning:'var(--accent-orange)', offline:'var(--accent-red)' };
  return (
    <span style={{color: colors[status] || 'var(--text-muted)', fontFamily:'var(--font-mono)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.1em'}}>
      ● {status}
    </span>
  );
};

/* ============================================================ */
export default function Network() {
  const [selected, setSelected] = useState(1);
  const [tick, setTick] = useState(0);
  const selCity = CITIES.find(c => c.id === selected);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x+1), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="network page-wrapper">
      <div className="grid-bg"/>
      <div className="glow-orb" style={{width:600,height:600, background:'rgba(0,229,255,0.04)', top:'10%', right:'-150px'}}/>

      {/* ===== PAGE HEADER ===== */}
      <div className="page-header container">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="badge badge-info">NETWORK MODULE</span>
            <span className="pulse-dot pulse-dot-cyan"/>
          </div>
          <h1 className="display-md">Mission Control</h1>
          <p style={{color:'var(--text-secondary)', marginTop:8}}>
            Real-time satellite sync, city node connectivity, and planetary albedo tracking.
          </p>
        </div>
        <div className="page-header__stats">
          <div className="metric-card" style={{minWidth:140}}>
            <div className="metric-value" style={{color:'var(--accent-green)'}}>{CITIES.filter(c=>c.status==='online').length}</div>
            <div className="metric-label">Cities Online</div>
          </div>
          <div className="metric-card" style={{minWidth:140}}>
            <div className="metric-value" style={{color:'var(--accent-cyan)'}}>{SATELLITES.filter(s=>s.status==='active').length}</div>
            <div className="metric-label">Satellites Active</div>
          </div>
          <div className="metric-card" style={{minWidth:140}}>
            <div className="metric-value" style={{color:'var(--accent-amber)'}}>0.21</div>
            <div className="metric-label">Avg Albedo</div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* ===== GLOBAL MAP ===== */}
        <div className="glass-panel mb-6" style={{overflow:'hidden'}}>
          <GlobalMap cities={CITIES} selected={selected} onSelect={setSelected}/>
        </div>

        {/* ===== CITY DETAIL + SATELLITE STATUS ===== */}
        <div className="net-grid mb-6">
          {/* City Detail */}
          <div className="glass-panel net-city-detail">
            <div className="section-label mb-6">
              <span className="heading-md">{selCity?.name} — Zone Report</span>
            </div>
            <div className="city-detail-grid">
              {[
                { label:'Land Surface Temp', value:`${selCity?.heat}°C`, color:'var(--accent-orange)' },
                { label:'Ward Nodes', value:selCity?.nodes, color:'var(--accent-cyan)' },
                { label:'Satellite Links', value:selCity?.satellites, color:'var(--accent-teal)' },
                { label:'Surface Albedo', value:selCity?.albedo, color:'var(--accent-purple)' },
              ].map((m,i) => (
                <div key={i} className="metric-card">
                  <div className="metric-value" style={{color:m.color}}>{m.value}</div>
                  <div className="metric-label">{m.label}</div>
                </div>
              ))}
            </div>
            {/* Albedo bar chart */}
            <div className="mt-6">
              <div className="section-label mb-4">
                <span className="label" style={{color:'var(--text-secondary)'}}>City Albedo vs Heat Index</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={albedoData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                  <XAxis dataKey="city" tick={{fill:'#7a9bb5', fontSize:10}}/>
                  <YAxis yAxisId="left" tick={{fill:'#7a9bb5', fontSize:10}}/>
                  <YAxis yAxisId="right" orientation="right" tick={{fill:'#7a9bb5', fontSize:10}}/>
                  <Tooltip contentStyle={{background:'var(--bg-panel)', border:'1px solid var(--glass-border)', borderRadius:8}}
                    labelStyle={{color:'var(--accent-cyan)'}}
                    itemStyle={{color:'var(--text-secondary)'}}/>
                  <Bar yAxisId="left" dataKey="albedo" fill="rgba(0,229,255,0.5)" radius={[3,3,0,0]} name="Albedo"/>
                  <Bar yAxisId="right" dataKey="heat" fill="rgba(255,109,0,0.5)" radius={[3,3,0,0]} name="Heat °C"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar — Data Completeness */}
          <div className="glass-panel" style={{padding:24}}>
            <div className="section-label mb-4">
              <span className="heading-md">Data Completeness Radar</span>
            </div>
            <p className="body-sm mb-6" style={{color:'var(--text-secondary)'}}>Coverage across all geospatial data layers for {selCity?.name}.</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,229,255,0.1)"/>
                <PolarAngleAxis dataKey="metric" tick={{fill:'#7a9bb5', fontSize:10}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:'#7a9bb5', fontSize:8}}/>
                <Radar name="Coverage" dataKey="value"
                  stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.15}
                  dot={{fill:'var(--accent-cyan)', r:3}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ===== SATELLITE TABLE ===== */}
        <div className="glass-panel mb-6">
          <div className="sat-table-header">
            <div className="section-label" style={{marginBottom:0}}>
              <span className="heading-md">Satellite Fleet Status</span>
            </div>
            <span className="badge badge-info">LIVE</span>
          </div>
          <div className="sat-table">
            <div className="sat-table__head">
              <span>ID</span><span>Sensor</span><span>Orbit</span>
              <span>Refresh</span><span>Signal</span><span>Status</span>
            </div>
            {SATELLITES.map(s => (
              <div key={s.id} className="sat-table__row">
                <span className="mono" style={{color:'var(--accent-cyan)'}}>{s.id}</span>
                <span style={{fontWeight:500}}>{s.type}</span>
                <span className="mono body-sm" style={{color:'var(--text-secondary)'}}>{s.orbit}</span>
                <span className="mono body-sm" style={{color:'var(--text-secondary)'}}>{s.refresh}</span>
                <div className="signal-bar-wrap">
                  <div className="signal-bar" style={{width:`${s.signal}%`, background: s.signal>90?'var(--accent-green)':s.signal>75?'var(--accent-amber)':'var(--accent-orange)'}}/>
                  <span className="mono" style={{fontSize:'0.7rem', color:'var(--text-secondary)', marginLeft:6}}>{s.signal}%</span>
                </div>
                <StatusPill status={s.status}/>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SIGNAL TELEMETRY ===== */}
        <div className="glass-panel" style={{padding:24, marginBottom:60}}>
          <div className="section-label mb-4">
            <span className="heading-md">Signal Telemetry — 30 Epochs</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={syntheticSignal}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
              <XAxis dataKey="t" tick={{fill:'#7a9bb5', fontSize:10}}/>
              <YAxis domain={[75,102]} tick={{fill:'#7a9bb5', fontSize:10}}/>
              <Tooltip contentStyle={{background:'var(--bg-panel)', border:'1px solid var(--glass-border)', borderRadius:8}}
                labelStyle={{color:'var(--accent-cyan)'}} itemStyle={{color:'var(--text-secondary)'}}/>
              <Legend wrapperStyle={{color:'var(--text-secondary)', fontSize:12}}/>
              <Line type="monotone" dataKey="sat1" stroke="var(--accent-cyan)" strokeWidth={1.5} dot={false} name="MODIS TERRA"/>
              <Line type="monotone" dataKey="sat2" stroke="var(--accent-green)" strokeWidth={1.5} dot={false} name="Sentinel-2A"/>
              <Line type="monotone" dataKey="sat3" stroke="var(--accent-amber)" strokeWidth={1.5} dot={false} name="Landsat 8"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
