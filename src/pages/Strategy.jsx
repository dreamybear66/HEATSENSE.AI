import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ComposedChart
} from 'recharts';
import './Strategy.css';

const WARDS_LIST = [
  'Koramangala','Whitefield','Jayanagar','Yelahanka',
  'Malleswaram','Bannerghatta','Hebbal','Lalbagh',
  'BTM Layout','HSR Layout','Electronic City','Marathahalli',
];

const WARD_CLUSTERS = {
  'Koramangala': 'C0 Critical',
  'Whitefield': 'C0 Critical',
  'Electronic City': 'C0 Critical',
  'Marathahalli': 'C0 Critical',
  'Jayanagar': 'C1 High Risk',
  'Yelahanka': 'C1 High Risk',
  'HSR Layout': 'C1 High Risk',
  'Malleswaram': 'C2 Moderate',
  'Hebbal': 'C2 Moderate',
  'BTM Layout': 'C2 Moderate',
  'Bannerghatta': 'C3 Safe',
  'Lalbagh': 'C3 Safe'
};

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
  const navigate = useNavigate();
  const [params, setParams] = useState({ trees:0, coolRoofs:0, evBuses:0, waterStations:0 });
  const [selectedWards, setSelectedWards] = useState(['Koramangala', 'Whitefield']);
  const [activePreset, setActivePreset] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ward = searchParams.get('ward');
    const interventionsStr = searchParams.get('interventions');
    
    if (ward) {
      setSelectedWards([ward]);
    }
    
    if (interventionsStr) {
      const interventions = interventionsStr.split(',');
      const newParams = { trees: 20, coolRoofs: 20, evBuses: 20, waterStations: 20 };
      
      const strLower = interventionsStr.toLowerCase();
      if (strLower.includes('tree')) newParams.trees = 85;
      if (strLower.includes('cool roof')) newParams.coolRoofs = 85;
      if (strLower.includes('ev bus')) newParams.evBuses = 85;
      if (strLower.includes('water station')) newParams.waterStations = 85;
      
      setParams(newParams);
      setActivePreset(null);
    }
  }, [location.search]);
  
  const [simState, setSimState] = useState({
    projection: [],
    baselineTemp: 0.0,
    targetWards: '',
    tempReduction: 0.0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, wards: selectedWards })
    })
      .then(res => res.json())
      .then(data => {
        setSimState({
          projection: data.projection,
          baselineTemp: data.baseline_temp,
          targetWards: data.target_wards,
          tempReduction: data.temp_reduction
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Simulation error', err);
        setLoading(false);
      });
  }, [params, selectedWards]);

  const simData = simState.projection;
  const finalYear = simData.length > 0 ? simData[5] : null;
  const baselineTemp = simState.baselineTemp;
  const tempReduction = simState.tempReduction.toFixed(2);

  const applyPreset = (p) => {
    setParams({ trees:p.trees, coolRoofs:p.coolRoofs, evBuses:p.evBuses, waterStations:p.waterStations });
    setActivePreset(p.name);
  };

  const toggleWard = (ward) => {
    setSelectedWards(prev =>
      prev.includes(ward) ? prev.filter(w=>w!==ward) : [...prev, ward]
    );
  };

  const deployPolicy = () => {
    if (selectedWards.length === 0) {
      alert("Please select at least one target ward before deploying.");
      return;
    }
    const totalIntervention = params.trees + params.coolRoofs + params.evBuses + params.waterStations;
    if (totalIntervention === 0) {
      alert("Please set at least one intervention parameter above 0% before deploying.");
      return;
    }
    const policy = {
      selectedWards,
      params,
      baselineTemp,
      tempReduction: parseFloat(tempReduction),
      finalYear
    };
    localStorage.setItem('thermal_mind_approved_policy', JSON.stringify(policy));
    setShowModal(true);
  };

  const sendNotification = async (method) => {
    const currentYear = new Date().getFullYear();
    let interventionsText = "";
    if (params.trees > 0) interventionsText += `\n🌳 Tree planting: Jan-Apr ${currentYear + 1}`;
    if (params.coolRoofs > 0) interventionsText += `\n🏠 Cool roof installations: Feb-Jun ${currentYear + 1}`;
    if (params.evBuses > 0) interventionsText += `\n🚌 EV bus route expansion: Apr ${currentYear + 1} onwards`;
    if (params.waterStations > 0) interventionsText += `\n💧 Hydration stations setup: May ${currentYear + 1} onwards`;

    if (interventionsText === "") interventionsText = "\nNo physical interventions planned at this time.";

    const smsDraft = `📢 BBMP Urban Heat Initiative Alert
📍 Wards: ${selectedWards.join(', ')}

We are launching a 5-year heat mitigation project targeting a -${tempReduction}°C reduction by ${currentYear + 5}.

🛠️ Planned Work Schedule:${interventionsText}

⚠️ Health Precautions During Peak Heat (12 PM - 4 PM):
• Stay indoors if possible
• Keep hydrated
• Use installed public hydration stations
• Report heat stress emergencies to 108

Track live progress at: bbmp.gov.in/heatplan`;

    setToastMsg(`Sending WhatsApp Broadcast to your phone...`);
    
    try {
      const response = await fetch('http://localhost:8000/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: smsDraft,
          target_number: "+916376092008"
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setToastMsg(`✅ SMS successfully delivered to your phone!`);
      } else {
        setToastMsg(`❌ SMS failed: ${data.error}`);
      }
    } catch (err) {
      setToastMsg(`❌ Network Error: Could not reach backend.`);
    }

    setTimeout(() => {
      setToastMsg(null);
      setShowModal(false);
      navigate('/logistics');
    }, 4000);
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
              <div className="section-label mb-2">
                <span className="label" style={{color:'var(--text-secondary)'}}>INTERVENTION PARAMETERS</span>
              </div>
              <div style={{color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:'16px'}}>
                Adjust each intervention to model its impact.
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
                    onClick={() => toggleWard(w)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '6px 12px', gap: '2px' }}>
                    <span style={{fontWeight: 600}}>{w}</span>
                    <span style={{fontSize: '0.65rem', opacity: 0.7}}>{WARD_CLUSTERS[w]}</span>
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
                Projected LST reduction for <strong style={{color:'var(--accent-cyan)'}}>{simState.targetWards || 'selected wards'}</strong>. Baseline = {baselineTemp > 0 ? `${baselineTemp}°C` : '…'}
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
                  <YAxis domain={['dataMin - 0.5', Math.max(Math.ceil(baselineTemp + 1), 'dataMax')]} tick={{fill:'#7a9bb5', fontSize:11}}/>
                  <Tooltip content={<CustomChartTooltip/>}/>
                  {baselineTemp > 0 && (
                    <ReferenceLine y={baselineTemp} stroke="rgba(255,23,68,0.4)" strokeDasharray="6 4"
                      label={{value:`Baseline ${baselineTemp}°C`, fill:'var(--accent-red)', fontSize:10}}/>
                  )}
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
                <span className="badge badge-info">ML-INFORMED</span>
              </div>
              <div className="policy-doc">
                <div className="policy-doc__header">
                  <span className="mono" style={{color:'var(--accent-cyan)', fontSize:'0.7rem'}}>
                    DRAFT — BENGALURU URBAN HEAT MITIGATION PLAN · {new Date().getFullYear()}–{new Date().getFullYear() + 5}
                  </span>
                  <span className="mono" style={{color:'var(--text-muted)', fontSize:'0.65rem'}}>
                    Generated: {new Date().toLocaleString()}
                  </span>
                </div>
                <div className="policy-doc__body">
                  <div className="policy-line" style={{background:'rgba(0,229,255,0.05)', padding:'10px 12px', borderRadius:6, marginBottom:8}}>
                    <span style={{fontWeight:700, color:'var(--text-primary)'}}>Target Wards</span>
                    <span style={{color:'var(--accent-cyan)', fontWeight:600}}>
                      {simState.targetWards || selectedWards.join(', ') || 'None selected'}
                    </span>
                  </div>
                  <div className="policy-line">
                    <span>Current Baseline LST (avg. of selected wards)</span>
                    <span style={{color:'var(--accent-red)', fontWeight:700}}>
                      {baselineTemp > 0 ? `${baselineTemp}°C` : 'Loading…'}
                    </span>
                  </div>
                  <div className="policy-line"><span>Tree Planting Coverage</span><span>{params.trees}% of eligible plots</span></div>
                  <div className="policy-line"><span>Cool Roof Adoption</span><span>{params.coolRoofs}% of commercial buildings</span></div>
                  <div className="policy-line"><span>EV Bus Fleet Target</span><span>{params.evBuses}% of routes by Y5</span></div>
                  <div className="policy-line"><span>Water Station Density Target</span><span>{params.waterStations}%</span></div>
                  <div className="policy-line" style={{borderTop:'1px solid var(--glass-border)', paddingTop:12, marginTop:8}}>
                    <span>ML-Predicted Temp Reduction (Y5)</span>
                    <span style={{color:'var(--accent-cyan)', fontWeight:700}}>
                      −{tempReduction}°C{' '}
                      <span style={{fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:400}}>(sklearn LinearRegression, UHI-grounded)</span>
                    </span>
                  </div>
                  <div className="policy-line">
                    <span>Projected LST after 5 years</span>
                    <span style={{color:'var(--accent-green)', fontWeight:700}}>
                      {finalYear ? `${finalYear.temp}°C` : '—'}
                    </span>
                  </div>
                  <div className="policy-line">
                    <span>Lives Protected (cumulative)</span>
                    <span style={{color:'var(--accent-green)', fontWeight:700}}>
                      {finalYear ? finalYear.livesProtected.toLocaleString() : 0}
                    </span>
                  </div>
                  <div className="policy-line">
                    <span>CO₂ Avoided (5-year)</span>
                    <span style={{color:'var(--accent-amber)', fontWeight:700}}>
                      {finalYear ? finalYear.carbonSaved.toLocaleString() : 0} tonnes
                    </span>
                  </div>
                </div>
                <div className="policy-doc__actions">
                  <button className="btn btn-primary" onClick={deployPolicy}>
                    ⚡ Approve & Deploy
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const pageW = doc.internal.pageSize.getWidth();  // 210mm
                    const margin = 18;
                    const contentW = pageW - margin * 2;             // 174mm
                    const labelX = margin;
                    const valueX = margin + 110;                     // fixed value column start
                    let y = 0;

                    // ── White background ──
                    doc.setFillColor(255, 255, 255);
                    doc.rect(0, 0, pageW, 297, 'F');

                    // ── Header band ──
                    doc.setFillColor(8, 18, 40);
                    doc.rect(0, 0, pageW, 32, 'F');

                    doc.setTextColor(0, 200, 230);
                    doc.setFontSize(15);
                    doc.setFont('helvetica', 'bold');
                    doc.text('THERMAL MIND', margin, 13);

                    doc.setFontSize(9);
                    doc.setTextColor(170, 200, 225);
                    doc.setFont('helvetica', 'normal');
                    doc.text('Urban Heat Survival Planner — Policy Report', margin, 21);

                    doc.setFontSize(7.5);
                    doc.setTextColor(100, 140, 170);
                    doc.text(`DRAFT  ·  Generated: ${new Date().toLocaleString()}`, margin, 28);

                    y = 44;

                    // ── Section header helper ──
                    const section = (title) => {
                      doc.setFillColor(235, 242, 252);
                      doc.rect(margin, y - 5, contentW, 8, 'F');
                      doc.setDrawColor(180, 205, 230);
                      doc.line(margin, y + 3, margin + contentW, y + 3);
                      doc.setFontSize(8.5);
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(20, 60, 120);
                      doc.text(title.toUpperCase(), margin + 2, y + 1);
                      y += 11;
                    };

                    // ── Row helper: label left, value right-of-fixed-column ──
                    const row = (label, value, valueRgb = [20, 20, 20]) => {
                      // label
                      doc.setFontSize(9);
                      doc.setFont('helvetica', 'normal');
                      doc.setTextColor(55, 65, 80);
                      doc.text(label, labelX + 2, y);
                      // value — left-aligned from valueX
                      doc.setFont('helvetica', 'bold');
                      doc.setTextColor(...valueRgb);
                      doc.text(String(value), valueX, y);
                      // separator line
                      doc.setDrawColor(215, 225, 235);
                      doc.line(margin, y + 2.5, margin + contentW, y + 2.5);
                      y += 9;
                    };

                    // ── Target Wards (big highlight box) ──
                    doc.setFillColor(240, 248, 255);
                    doc.setDrawColor(0, 180, 220);
                    doc.roundedRect(margin, y - 4, contentW, 14, 2, 2, 'FD');
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(40, 80, 120);
                    doc.text('TARGET WARDS', margin + 3, y + 1);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 80, 160);
                    doc.text(simState.targetWards || selectedWards.join(', ') || 'None selected', margin + 3, y + 7);
                    y += 20;

                    // ── Baseline Assessment ──
                    section('Baseline Assessment');
                    row('Avg. Land Surface Temp — selected wards', `${baselineTemp} °C`, [200, 40, 40]);

                    // ── Intervention Parameters ──
                    section('Intervention Parameters');
                    row('Tree Planting Coverage', `${params.trees}% of eligible plots`);
                    row('Cool Roof Adoption', `${params.coolRoofs}% of commercial buildings`);
                    row('EV Bus Fleet Conversion', `${params.evBuses}% of routes by Year 5`);
                    row('Water Station Density Target', `${params.waterStations}%`);

                    // ── AI Model Transparency ──
                    section('AI Model — sklearn LinearRegression (UHI-Grounded)');
                    row('Training Dataset', '1,000 scenarios (literature coefficients)');
                    row('Trees: coefficient', '-0.020 °C per 1% canopy increase', [20, 120, 60]);
                    row('Cool Roofs: coefficient', '-0.015 °C per 1% adoption', [20, 120, 60]);
                    row('EV Buses: coefficient', '-0.005 °C per 1% fleet share', [20, 120, 60]);
                    row('Water Stations: coefficient', '-0.008 °C per 1% station density', [20, 120, 60]);

                    // ── 5-Year Projections ──
                    section('5-Year Projections (ML Output)');
                    row('ML-Predicted Temp Reduction (Y5)', `-${tempReduction} °C`, [0, 100, 200]);
                    row('Projected LST after 5 years', finalYear ? `${finalYear.temp} °C` : '—', [20, 140, 80]);
                    row('Lives Protected (cumulative)', finalYear ? finalYear.livesProtected.toLocaleString() : '0', [20, 140, 80]);
                    row('CO\u2082 Avoided (5-year total)', finalYear ? `${finalYear.carbonSaved.toLocaleString()} tonnes` : '0', [160, 110, 0]);

                    // ── Footer ──
                    doc.setDrawColor(200, 215, 230);
                    doc.line(margin, 284, margin + contentW, 284);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(120, 140, 160);
                    doc.text('Thermal Mind  ·  AI-Based Urban Heat Survival Planner', margin, 290);
                    doc.text('github.com/dreamybear66/HEATSENSE.AI', margin + contentW, 290, { align: 'right' });

                    const fileName = `HeatMind_Policy_${(selectedWards[0] || 'Bengaluru').replace(/ /g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
                    doc.save(fileName);
                  }}>
                    ↓ Export as PDF
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    const text = `Bengaluru Heat Plan: ${simState.targetWards} | Baseline: ${baselineTemp}°C | ML-predicted reduction: -${tempReduction}°C by ${new Date().getFullYear()+5} via trees(${params.trees}%), cool roofs(${params.coolRoofs}%), EVs(${params.evBuses}%), water(${params.waterStations}%).`;
                    navigator.clipboard.writeText(text).then(() => alert('Summary copied to clipboard!'));
                  }}>
                    ⬡ Copy Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Citizen Alert Modal */}
      {showModal && (
        <div className="alert-modal-overlay">
          <div className="alert-modal-content">
            <h2 style={{ marginBottom: 16 }}>Citizen Communication Draft</h2>
            <div className="alert-message-box">
              <p><strong>📢 BBMP Urban Heat Initiative — {selectedWards.join(' & ')}</strong></p>
              <br/>
              <p>Starting January {new Date().getFullYear() + 1}, your ward will see:</p>
              <ul>
                {params.trees > 0 && <li>🌳 Tree planting along major corridors (Jan–Apr)</li>}
                {params.coolRoofs > 0 && <li>🏠 Cool roof installations on commercial buildings (Feb–Jun)</li>}
                {params.evBuses > 0 && <li>🚌 EV bus routes expanded by {params.evBuses}% (Apr onwards)</li>}
                {params.waterStations > 0 && <li>💧 New hydration stations added (May onwards)</li>}
              </ul>
              <br/>
              <p>Expected outcome: <strong>-{tempReduction}°C</strong> reduction in local heat by {new Date().getFullYear() + 5}.</p>
              <p>This affects ~{(selectedWards.length * 22500).toLocaleString()} residents.</p>
              <br/>
              <p>For updates: bbmp.gov.in/heatplan</p>
            </div>
            
            <div className="alert-modal-actions">
              <button className="btn btn-secondary" style={{color:'#25D366', borderColor:'#25D366', fontWeight:'600'}} onClick={() => sendNotification('WhatsApp Broadcast')}>💬 Share WhatsApp Broadcast</button>
              <button className="btn" style={{marginLeft:'auto'}} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="alert-toast">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
