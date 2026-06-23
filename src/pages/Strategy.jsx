import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import './Strategy.css';

const WARDS_LIST = [
  'Koramangala','Whitefield','Jayanagar','Yelahanka',
  'Malleswaram','Bannerghatta','Hebbal','Lalbagh',
  'BTM Layout','HSR Layout','Electronic City','Marathahalli',
];

const SCENARIO_PRESETS = [
  { name:'Aggressive Green', icon:'🌳', trees:80, coolRoofs:60, evBuses:70, waterStations:50 },
  { name:'Cool Infrastructure', icon:'🏠', trees:30, coolRoofs:90, evBuses:50, waterStations:60 },
  { name:'EV + Trees',         icon:'🚌', trees:70, coolRoofs:40, evBuses:85, waterStations:40 },
  { name:'Minimal Effort',    icon:'📋', trees:20, coolRoofs:20, evBuses:20, waterStations:20 },
];

const CustomChartTooltip = ({active, payload, label}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label mono">{label}</div>
      {payload.map((p,i) => (
        <div key={i} className="chart-tooltip__row">
          <span style={{color:p.color}}>{p.name}</span>
          <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ============================================================ */
export default function Strategy() {
  const [params, setParams] = useState({ trees:50, coolRoofs:50, evBuses:50, waterStations:50 });
  const [selectedWards, setSelectedWards] = useState(['Koramangala', 'Whitefield']);
  const [activePreset, setActivePreset] = useState(null);
  const [simData, setSimData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
      .then(res => res.json())
      .then(data => {
        setSimData(data.projection);
        setLoading(false);
      })
      .catch(err => {
        console.error('Simulation error', err);
        setLoading(false);
      });
  }, [params]);

  const finalYear = simData.length > 0 ? simData[5] : null;
  const baselineTemp = 42.1;
  const tempReduction = finalYear ? (baselineTemp - finalYear.temp).toFixed(2) : "0.00";

  const applyPreset = (p) => {
    setParams({ trees:p.trees, coolRoofs:p.coolRoofs, evBuses:p.evBuses, waterStations:p.waterStations });
    setActivePreset(p.name);
  };

  const toggleWard = (ward) => {
    setSelectedWards(prev =>
      prev.includes(ward) ? prev.filter(w=>w!==ward) : [...prev, ward]
    );
  };

  const SLIDERS = [
    { key:'trees',          label:'🌳 Tree Planting Coverage', color:'var(--accent-green)', unit:'%' },
    { key:'coolRoofs',      label:'🏠 Cool Roof Adoption',     color:'var(--accent-cyan)',  unit:'%' },
    { key:'evBuses',        label:'🚌 EV Bus Fleet Share',     color:'var(--accent-teal)',  unit:'%' },
    { key:'waterStations',  label:'💧 Water Station Density',  color:'var(--accent-purple)', unit:'%' },
  ];

  return (
    <div className="strategy page-wrapper">
      <div className="grid-bg"/>
      <div className="glow-orb" style={{width:500,height:500,background:'rgba(29,233,182,0.05)',bottom:'10%',right:'-100px'}}/>

      {/* PAGE HEADER */}
      <div className="page-header container">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="badge badge-info">SIMULATION ENGINE</span>
            <span className="badge badge-safe">5-YEAR PROJECTION</span>
          </div>
          <h1 className="display-md">Strategy Planner</h1>
          <p style={{color:'var(--text-secondary)', marginTop:8}}>
            Run "What-if" scenarios and project temperature reduction impacts before exporting policy documents.
          </p>
        </div>
        {/* Impact summary */}
        <div className="strategy-impact-row">
          {[
            { label:'Temp Reduction', value:`-${tempReduction}°C`, color:'var(--accent-cyan)' },
            { label:'Lives Protected', value: finalYear ? (finalYear.livesProtected > 1000 ? `${(finalYear.livesProtected/1000).toFixed(0)}K` : finalYear.livesProtected) : '0', color:'var(--accent-green)' },
            { label:'CO₂ Saved (t)', value: finalYear ? `${(finalYear.carbonSaved/1000).toFixed(1)}K` : '0', color:'var(--accent-amber)' },
          ].map((m,i) => (
            <div key={i} className="metric-card" style={{minWidth:140}}>
              <div className="metric-value" style={{color:m.color}}>{m.value}</div>
              <div className="metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="strategy-layout">
          {/* ===== CONTROL PANEL ===== */}
          <div className="strategy-controls">
            {/* Presets */}
            <div className="glass-panel-sm" style={{padding:20, marginBottom:16}}>
              <div className="section-label mb-4">
                <span className="label" style={{color:'var(--text-secondary)'}}>SCENARIO PRESETS</span>
              </div>
              <div className="preset-grid">
                {SCENARIO_PRESETS.map(p => (
                  <button key={p.name}
                    className={`preset-btn ${activePreset===p.name?'preset-btn--active':''}`}
                    onClick={() => applyPreset(p)}>
                    <span style={{fontSize:'1.2rem'}}>{p.icon}</span>
                    <span className="body-sm">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="glass-panel-sm" style={{padding:20, marginBottom:16}}>
              <div className="section-label mb-4">
                <span className="label" style={{color:'var(--text-secondary)'}}>INTERVENTION PARAMETERS</span>
              </div>
              <div className="sliders">
                {SLIDERS.map(s => (
                  <div key={s.key} className="slider-group">
                    <div className="slider-label">
                      <span className="body-sm">{s.label}</span>
                      <span className="mono" style={{color:s.color, fontSize:'0.9rem', fontWeight:700}}>
                        {params[s.key]}%
                      </span>
                    </div>
                    <div className="slider-track">
                      <div className="slider-fill" style={{
                        width:`${params[s.key]}%`,
                        background: `linear-gradient(90deg, ${s.color}80, ${s.color})`
                      }}/>
                      <input type="range" min="0" max="100"
                        value={params[s.key]}
                        onChange={e => { setParams(p => ({...p, [s.key]:+e.target.value})); setActivePreset(null); }}
                        className="range-input"
                        style={{'--thumb-color': s.color}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ward Selector */}
            <div className="glass-panel-sm" style={{padding:20}}>
              <div className="section-label mb-4">
                <span className="label" style={{color:'var(--text-secondary)'}}>TARGET WARDS</span>
              </div>
              <div className="ward-chips">
                {WARDS_LIST.map(w => (
                  <button key={w}
                    className={`ward-chip ${selectedWards.includes(w)?'ward-chip--active':''}`}
                    onClick={() => toggleWard(w)}>
                    {w}
                  </button>
                ))}
              </div>
              <div className="mt-4" style={{color:'var(--text-muted)', fontSize:'0.75rem'}}>
                {selectedWards.length} ward(s) targeted · {(selectedWards.length * 22500).toLocaleString()} est. residents
              </div>
            </div>
          </div>

          {/* ===== CHARTS PANEL ===== */}
          <div className="strategy-charts">
            {/* Temperature projection */}
            <div className="glass-panel mb-6" style={{padding:24}}>
              <div className="section-label mb-2">
                <span className="heading-md">5-Year Temperature Projection</span>
              </div>
              <p className="body-sm mb-6" style={{color:'var(--text-secondary)'}}>
                Projected LST reduction with applied intervention mix. Baseline = 42.1°C.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={simData}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                  <XAxis dataKey="year" tick={{fill:'#7a9bb5', fontSize:11}}/>
                  <YAxis domain={[33,44]} tick={{fill:'#7a9bb5', fontSize:11}}/>
                  <Tooltip content={<CustomChartTooltip/>}/>
                  <ReferenceLine y={42.1} stroke="rgba(255,23,68,0.3)" strokeDasharray="6 4" label={{value:'Baseline 42.1°C', fill:'var(--accent-red)', fontSize:10}}/>
                  <Area type="monotone" dataKey="temp" stroke="var(--accent-cyan)" fill="url(#tempGrad)" strokeWidth={2.5} name="Projected LST (°C)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Green Cover + Carbon */}
            <div className="grid-2 mb-6">
              <div className="glass-panel" style={{padding:24}}>
                <div className="section-label mb-4">
                  <span className="label" style={{color:'var(--text-secondary)'}}>GREEN COVER (NDVI)</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={simData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                    <XAxis dataKey="year" tick={{fill:'#7a9bb5', fontSize:10}}/>
                    <YAxis domain={[0.1, 0.7]} tick={{fill:'#7a9bb5', fontSize:10}}/>
                    <Tooltip content={<CustomChartTooltip/>}/>
                    <Bar dataKey="greenCover" fill="var(--accent-green)" opacity={0.75} radius={[4,4,0,0]} name="NDVI"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-panel" style={{padding:24}}>
                <div className="section-label mb-4">
                  <span className="label" style={{color:'var(--text-secondary)'}}>CARBON SAVED (tonnes)</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={simData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                    <XAxis dataKey="year" tick={{fill:'#7a9bb5', fontSize:10}}/>
                    <YAxis tick={{fill:'#7a9bb5', fontSize:10}}/>
                    <Tooltip content={<CustomChartTooltip/>}/>
                    <Bar dataKey="carbonSaved" fill="var(--accent-amber)" opacity={0.75} radius={[4,4,0,0]} name="CO₂ (t)"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Policy export */}
            <div className="glass-panel" style={{padding:24}}>
              <div className="section-label mb-4">
                <span className="heading-md">Policy Document Preview</span>
              </div>
              <div className="policy-doc">
                <div className="policy-doc__header">
                  <span className="mono" style={{color:'var(--accent-cyan)', fontSize:'0.7rem'}}>DRAFT — BENGALURU URBAN HEAT MITIGATION PLAN · 2025–2030</span>
                </div>
                <div className="policy-doc__body">
                  <div className="policy-line"><span>Target Wards</span><span>{selectedWards.join(', ') || 'None selected'}</span></div>
                  <div className="policy-line"><span>Tree Planting Coverage</span><span>{params.trees}% of eligible plots</span></div>
                  <div className="policy-line"><span>Cool Roof Adoption</span><span>{params.coolRoofs}% of commercial buildings</span></div>
                  <div className="policy-line"><span>EV Bus Fleet Target</span><span>{params.evBuses}% of routes by Y5</span></div>
                  <div className="policy-line"><span>Water Stations</span><span>{params.waterStations}% density target</span></div>
                  <div className="policy-line" style={{borderTop:'1px solid var(--glass-border)', paddingTop:12, marginTop:8}}>
                    <span>Projected Temp Reduction (Y5)</span>
                    <span style={{color:'var(--accent-cyan)', fontWeight:700}}>−{tempReduction}°C</span>
                  </div>
                  <div className="policy-line">
                    <span>Lives Protected (cumulative)</span>
                    <span style={{color:'var(--accent-green)', fontWeight:700}}>{finalYear ? finalYear.livesProtected.toLocaleString() : 0}</span>
                  </div>
                  <div className="policy-line">
                    <span>CO₂ Avoided (5-year)</span>
                    <span style={{color:'var(--accent-amber)', fontWeight:700}}>{finalYear ? finalYear.carbonSaved.toLocaleString() : 0} tonnes</span>
                  </div>
                </div>
                <div className="policy-doc__actions">
                  <button className="btn btn-primary" onClick={() => alert('Exporting PDF...')}>
                    ↓ Export PDF
                  </button>
                  <button className="btn btn-secondary" onClick={() => alert('Sharing...')}>
                    ⬡ Share Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
