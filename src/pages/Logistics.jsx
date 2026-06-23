import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Logistics.css';

/* ---- Ward Coordinates mapping for Bengaluru ---- */
const WARD_COORDS = {
  'Koramangala': { lat: 12.934, lng: 77.626 },
  'Whitefield':  { lat: 12.968, lng: 77.750 },
  'Jayanagar':   { lat: 12.924, lng: 77.582 },
  'Yelahanka':   { lat: 13.100, lng: 77.594 },
  'Malleswaram': { lat: 13.003, lng: 77.565 },
  'Bannerghatta':{ lat: 12.830, lng: 77.580 },
  'Hebbal':      { lat: 13.035, lng: 77.597 },
  'Lalbagh':     { lat: 12.950, lng: 77.590 },
  'BTM Layout':  { lat: 12.916, lng: 77.610 },
  'HSR Layout':  { lat: 12.910, lng: 77.640 },
  'Electronic City': { lat: 12.850, lng: 77.660 },
  'Marathahalli':{ lat: 12.956, lng: 77.700 },
};

const GANTT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LOG_ICON = { tree: '🌳', roof: '🏠', water: '💧', ev: '🚌', alert: '⚠️' };
const LOG_SEVERITY_CLASS = { info: 'log-info', success: 'log-success', warning: 'log-warning', critical: 'log-critical' };

/* ---- Helper to build glowing custom Leaflet DivIcons ---- */
const createCustomIcon = (type, status) => {
  const ICON = { 'Planting Vehicle': '🌳', 'Cool Roof Crew': '🏠', 'Water Station': '💧', 'EV Bus': '🚌' };
  const SCOL = { active: '#00e676', transit: '#ffb300', installed: '#00e5ff', planned: '#7a9bb5' };
  const col = SCOL[status] || '#7a9bb5';

  return L.divIcon({
    className: 'custom-fleet-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(8, 13, 20, 0.9);
        border: 2px solid ${col};
        box-shadow: 0 0 10px ${col};
        font-size: 14px;
        cursor: pointer;
      ">
        ${ICON[type] || '○'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

/* ---- Fleet Map (Interactive Leaflet Map) ---- */
function FleetMap({ fleet }) {
  // Center map dynamically on first fleet vehicle's coordinates, or default to Bengaluru Center
  const firstVehicle = fleet[0];
  const defaultCenter = [12.9716, 77.5946];
  const center = firstVehicle && WARD_COORDS[firstVehicle.ward]
    ? [WARD_COORDS[firstVehicle.ward].lat, WARD_COORDS[firstVehicle.ward].lng]
    : defaultCenter;

  return (
    <div className="fleet-map">
      <div className="fleet-map__label">
        <span className="label" style={{ color: 'var(--accent-cyan)' }}>⬡ FLEET OPERATIONS — INTERACTIVE MAP</span>
        <span className="pulse-dot pulse-dot-green"/>
      </div>
      <div style={{ height: '260px', width: '100%', position: 'relative', zIndex: 10 }}>
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            attribution='&copy; Stadia Maps, &copy; OpenStreetMap contributors'
          />
          {fleet.map(v => {
            const baseCoords = WARD_COORDS[v.ward] || { lat: 12.97, lng: 77.59 };
            // Slightly offset multiple vehicles in the same ward to prevent complete overlapping
            const seed = v.id.charCodeAt(v.id.length - 1) || 0;
            const latOffset = ((seed % 5) - 2) * 0.004;
            const lngOffset = (((seed * 3) % 5) - 2) * 0.004;
            const position = [baseCoords.lat + latOffset, baseCoords.lng + lngOffset];

            return (
              <Marker
                key={v.id}
                position={position}
                icon={createCustomIcon(v.type, v.status)}
              >
                <Popup className="leaflet-dark-popup">
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                      Unit {v.id} ({v.type})
                    </div>
                    <div>Ward: <strong>{v.ward}</strong></div>
                    <div>Status: <span style={{ 
                      color: v.status === 'active' ? 'var(--accent-green)' : v.status === 'installed' ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                      fontWeight: 'bold'
                    }}>{v.status.toUpperCase()}</span></div>
                    {v.trees > 0 && <div style={{ marginTop: '4px' }}>Progress: <strong>{v.trees} plots</strong></div>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

/* ============================================================ */
export default function Logistics() {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(() => {
    const raw = localStorage.getItem('thermal_mind_approved_policy');
    return raw ? JSON.parse(raw) : null;
  });

  const [log, setLog] = useState([]);
  const [tick, setTick] = useState(0);

  // Clear policy action
  const clearPolicy = () => {
    if (confirm("Are you sure you want to clear the active deployment?")) {
      localStorage.removeItem('thermal_mind_approved_policy');
      setPolicy(null);
    }
  };

  // Generate rollout metrics and lists dynamically if policy is present
  let ganttTasks = [];
  let fleet = [];
  let progressData = [];
  let allocationData = [];
  let weeklyProgress = [];
  let totalFleetCount = 0;
  let treesCountToday = 0;
  let roofsCountToday = 0;

  if (policy) {
    const { selectedWards, params } = policy;

    // 1. Gantt Tasks Generator
    let taskId = 1;
    // Always include a baseline survey task
    ganttTasks.push({
      id: taskId++,
      name: `Baseline Ward Survey & GIS`,
      team: 'GIS Unit',
      start: 0,
      dur: 2,
      color: '#00e5ff',
      status: 'completed'
    });

    selectedWards.forEach((ward, index) => {
      // Stagger start months based on index
      const stagger = index % 3;
      
      if (params.trees > 0) {
        ganttTasks.push({
          id: taskId++,
          name: `Tree Planting — ${ward}`,
          team: 'Green Corps',
          start: stagger,
          dur: Math.max(2, Math.round(params.trees / 15)),
          color: '#00e676',
          status: params.trees > 70 && stagger === 0 ? 'completed' : stagger < 2 ? 'active' : 'planned'
        });
      }

      if (params.coolRoofs > 0) {
        ganttTasks.push({
          id: taskId++,
          name: `Cool Roofs — ${ward}`,
          team: 'Infra Unit A',
          start: stagger + 1,
          dur: Math.max(2, Math.round(params.coolRoofs / 20)),
          color: '#ffb300',
          status: stagger < 1 ? 'active' : 'planned'
        });
      }

      if (params.evBuses > 0) {
        ganttTasks.push({
          id: taskId++,
          name: `EV Corridor Setup — ${ward}`,
          team: 'Transport Dept',
          start: stagger + 2,
          dur: Math.max(3, Math.round(params.evBuses / 20)),
          color: '#7c4dff',
          status: 'planned'
        });
      }

      if (params.waterStations > 0) {
        ganttTasks.push({
          id: taskId++,
          name: `Water Station Grid — ${ward}`,
          team: 'BBMP Works',
          start: stagger,
          dur: Math.max(2, Math.round(params.waterStations / 25)),
          color: '#1de9b6',
          status: stagger === 0 ? 'completed' : 'active'
        });
      }
    });

    // 2. Fleet Data Generator
    let vehicleIdx = 1;
    selectedWards.forEach((ward, idx) => {
      if (params.trees > 0) {
        fleet.push({
          id: `GC-${String(vehicleIdx++).padStart(2, '0')}`,
          type: 'Planting Vehicle',
          ward,
          status: idx % 2 === 0 ? 'active' : 'transit',
          trees: Math.round(50 + (params.trees * 1.5))
        });
      }
      if (params.coolRoofs > 0) {
        fleet.push({
          id: `CR-${String(vehicleIdx++).padStart(2, '0')}`,
          type: 'Cool Roof Crew',
          ward,
          status: idx % 2 === 0 ? 'active' : 'transit',
          trees: 0
        });
      }
      if (params.waterStations > 0) {
        fleet.push({
          id: `WS-${String(vehicleIdx++).padStart(2, '0')}`,
          type: 'Water Station',
          ward,
          status: 'installed',
          trees: 0
        });
      }
      if (params.evBuses > 0 && idx % 2 === 0) {
        fleet.push({
          id: `EV-${String(vehicleIdx++).padStart(2, '0')}`,
          type: 'EV Bus',
          ward,
          status: 'active',
          trees: 0
        });
      }
    });
    totalFleetCount = fleet.length;

    // 3. Progress Chart Data
    selectedWards.forEach((ward, idx) => {
      // Progress depends on configuration levels
      progressData.push({
        ward,
        trees: Math.round(params.trees * (0.7 + (idx % 4) * 0.1)),
        roofs: Math.round(params.coolRoofs * (0.6 + (idx % 3) * 0.15)),
        water: Math.round(params.waterStations * (0.8 - (idx % 2) * 0.1)),
      });
    });

    // 4. Budget Allocation Pie Chart
    const totalSliders = params.trees + params.coolRoofs + params.evBuses + params.waterStations;
    if (totalSliders > 0) {
      allocationData = [
        { name: 'Tree Planting', value: Math.round((params.trees / totalSliders) * 100), color: '#00e676' },
        { name: 'Cool Roofs',    value: Math.round((params.coolRoofs / totalSliders) * 100), color: '#00e5ff' },
        { name: 'EV Buses',      value: Math.round((params.evBuses / totalSliders) * 100), color: '#7c4dff' },
        { name: 'Water Stations',value: Math.round((params.waterStations / totalSliders) * 100), color: '#1de9b6' },
      ].filter(item => item.value > 0);
    } else {
      allocationData = [{ name: 'N/A', value: 100, color: '#7a9bb5' }];
    }

    // 5. Daily counts estimations
    treesCountToday = Math.round(params.trees * 0.8 + selectedWards.length * 3);
    roofsCountToday = Math.round(params.coolRoofs * 0.08 + selectedWards.length * 0.5);

    // 6. Weekly Activity Chart
    weeklyProgress = Array.from({ length: 12 }, (_, i) => ({
      week: `W${i + 1}`,
      trees: Math.round((params.trees * 1.2) + Math.sin(i) * 15 + 20),
      roofs: Math.round((params.coolRoofs * 0.15) + Math.cos(i) * 2 + 3),
      water: Math.round((params.waterStations * 0.08) + (i % 3 === 0 ? 1 : 0)),
    }));
  }

  // Populate dynamic Initial Logs based on selected wards and active inputs
  useEffect(() => {
    if (!policy) return;
    const { selectedWards, params } = policy;
    const activeTypes = [];
    if (params.trees > 0) activeTypes.push({ type: 'tree', label: 'Tree planted at [Ward] Sector [Num]', icon: '🌳', severity: 'info' });
    if (params.coolRoofs > 0) activeTypes.push({ type: 'roof', label: 'Cool roof installation completed — [Ward] Area [Num]', icon: '🏠', severity: 'success' });
    if (params.waterStations > 0) activeTypes.push({ type: 'water', label: 'Water station GC-WS-[Num] online at [Ward]', icon: '💧', severity: 'success' });
    if (params.evBuses > 0) activeTypes.push({ type: 'ev', label: 'EV bus corridor route in [Ward] active', icon: '🚌', severity: 'info' });
    
    // Always fallback alert
    activeTypes.push({ type: 'alert', label: 'Temperature sensor calibrated in [Ward]', icon: '⚠️', severity: 'info' });
    
    const initial = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const pastTime = new Date(now.getTime() - i * 15 * 60 * 1000);
      const ts = pastTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const config = activeTypes[i % activeTypes.length];
      const ward = selectedWards[i % selectedWards.length];
      
      const eventText = config.label
        .replace('[Ward]', ward)
        .replace('[Num]', String((i * 7) % 15 + 1));

      initial.push({
        id: i + 1,
        ts,
        event: eventText,
        type: config.type,
        ward,
        severity: i === 3 ? 'warning' : config.severity
      });
    }
    setLog(initial);
  }, [policy]);

  // Simulate live log entries matching chosen policy
  useEffect(() => {
    if (!policy) return;
    const { selectedWards, params } = policy;
    
    const liveEvents = [];
    if (params.trees > 0) liveEvents.push({ type: 'tree', msg: 'Watering team dispatched to tree plots in [Ward]', severity: 'info' });
    if (params.coolRoofs > 0) liveEvents.push({ type: 'roof', msg: 'Reflectivity inspection passed: [Ward]', severity: 'success' });
    if (params.waterStations > 0) liveEvents.push({ type: 'water', msg: 'Refill warning cleared at [Ward] station', severity: 'info' });
    if (params.evBuses > 0) liveEvents.push({ type: 'ev', msg: 'EV Bus telematics sync completed in [Ward]', severity: 'info' });
    liveEvents.push({ type: 'alert', msg: 'Localized LST reading in [Ward]: 38.6°C (nominal)', severity: 'info' });

    const interval = setInterval(() => {
      const now = new Date();
      const ts = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const eventConfig = liveEvents[Math.floor(Math.random() * liveEvents.length)];
      const targetWard = selectedWards[Math.floor(Math.random() * selectedWards.length)];
      
      const eventText = eventConfig.msg.replace('[Ward]', targetWard);

      setLog(prev => [{
        id: Date.now(),
        ts,
        event: eventText,
        type: eventConfig.type,
        ward: targetWard,
        severity: eventConfig.severity,
      }, ...prev.slice(0, 19)]);
      setTick(t => t + 1);
    }, 3500);

    return () => clearInterval(interval);
  }, [policy]);

  // If no policy approved, render placeholder fallback screen
  if (!policy) {
    return (
      <div className="logistics page-wrapper flex items-center justify-center" style={{ minHeight: '85vh', paddingBottom: 60 }}>
        <div className="grid-bg"/>
        <div className="glass-panel text-center animate-fade-up" style={{ padding: '48px 32px', maxWidth: 500, margin: '0 auto', border: '1px solid rgba(0,229,255,0.18)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: 16 }}>📋</span>
          <h2 className="heading-lg mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>No Active Operations</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
            No heat mitigation policy has been approved yet. Define targeted wards, model projections, and approve a policy in the Strategy Planner first.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/strategy')}>
            ⚡ Go to Strategy Planner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="logistics page-wrapper">
      <div className="grid-bg"/>
      <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(0,230,118,0.04)', top: '30%', right: '-80px' }}/>

      {/* PAGE HEADER */}
      <div className="page-header container">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="badge badge-safe">ACTIVE DEPLOYMENT</span>
            <span className="badge badge-info">{totalFleetCount} UNITS DEPLOYED</span>
            <button className="badge badge-critical" style={{ cursor: 'pointer', background: 'rgba(255, 23, 68, 0.08)' }} onClick={clearPolicy}>
              ⬡ Clear Active Policy
            </button>
          </div>
          <h1 className="display-md">Logistics Center</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            Gantt-based deployment tracking, fleet positioning, and real-time logs for: <strong style={{ color: 'var(--accent-cyan)' }}>{policy.selectedWards.join(', ')}</strong>.
          </p>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4 }}>
            Active Policy Target: <span style={{ color: 'var(--accent-green)' }}>-{policy.tempReduction.toFixed(2)}°C LST Reduction</span> (ML-predicted).
          </div>
        </div>
        <div className="flex gap-4">
          {[
            { v: treesCountToday, l: 'Trees Today', c: 'var(--accent-green)' },
            { v: roofsCountToday, l: 'Roofs Done',  c: 'var(--accent-cyan)' },
            { v: totalFleetCount, l: 'Fleet Active',c: 'var(--accent-teal)' },
            { v: tick, l: 'Log Events',  c: 'var(--accent-amber)' },
          ].map((m, i) => (
            <div key={i} className="metric-card" style={{ minWidth: 120 }}>
              <div className="metric-value" style={{ color: m.c, fontSize: '1.6rem' }}>{m.v}</div>
              <div className="metric-label">{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        {/* ===== GANTT CHART ===== */}
        <div className="glass-panel mb-6" style={{ overflow: 'hidden' }}>
          <div className="gantt-header">
            <div className="section-label" style={{ marginBottom: 0 }}>
              <span className="heading-md">Deployment Gantt — Rollout Schedule</span>
            </div>
            <div className="flex gap-4">
              {['completed', 'active', 'planned'].map(s => (
                <div key={s} className="flex items-center gap-4">
                  <span className={`badge badge-${s === 'completed' ? 'safe' : s === 'active' ? 'info' : 'moderate'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="gantt-body">
            {/* Month header */}
            <div className="gantt-months">
              <div className="gantt-task-label-col"/>
              {GANTT_MONTHS.map(m => (
                <div key={m} className="gantt-month">{m}</div>
              ))}
            </div>
            {/* Tasks */}
            {ganttTasks.map(task => (
              <div key={task.id} className="gantt-row">
                <div className="gantt-task-info">
                  <span className="body-sm" style={{ fontWeight: 500 }}>{task.name}</span>
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{task.team}</span>
                </div>
                <div className="gantt-track">
                  <div className="gantt-bar"
                    style={{
                      left: `${(task.start / 12) * 100}%`,
                      width: `${(task.dur / 12) * 100}%`,
                      background: task.color,
                      opacity: task.status === 'planned' ? 0.35 : task.status === 'active' ? 0.8 : 0.55,
                      boxShadow: task.status === 'active' ? `0 0 10px ${task.color}80` : 'none',
                    }}>
                    <span className="mono" style={{ fontSize: '0.62rem', color: 'rgba(0,0,0,0.8)', fontWeight: 700, padding: '0 6px' }}>
                      {task.dur}mo
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== FLEET + LOG ===== */}
        <div className="log-fleet-grid mb-6">
          {/* Fleet Map */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <FleetMap fleet={fleet}/>
            <div className="fleet-list">
              {fleet.map(v => (
                <div key={v.id} className="fleet-row">
                  <span className="mono body-sm" style={{ color: 'var(--accent-cyan)' }}>{v.id}</span>
                  <span className="body-sm">{v.type}</span>
                  <span className="body-sm" style={{ color: 'var(--text-secondary)' }}>{v.ward}</span>
                  <span className={`badge badge-${v.status === 'active' ? 'safe' : v.status === 'installed' ? 'info' : 'moderate'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Log */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="log-header">
              <div className="flex items-center gap-4">
                <span className="pulse-dot pulse-dot-cyan"/>
                <span className="heading-md">Intervention Log</span>
              </div>
              <span className="badge badge-info">LIVE</span>
            </div>
            <div className="log-feed">
              {log.map((entry, i) => (
                <div key={entry.id}
                  className={`log-entry ${LOG_SEVERITY_CLASS[entry.severity]} ${i === 0 ? 'log-entry--new' : ''}`}>
                  <span className="log-entry__icon">{LOG_ICON[entry.type]}</span>
                  <div className="log-entry__body">
                    <div className="log-entry__event">{entry.event}</div>
                    <div className="log-entry__meta">
                      <span className="mono">{entry.ts}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--text-muted)' }}>{entry.ward}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${entry.severity === 'critical' ? 'critical' : entry.severity === 'warning' ? 'high' : entry.severity === 'success' ? 'safe' : 'info'}`}>
                    {entry.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PROGRESS CHARTS ===== */}
        <div className="progress-charts-grid mb-8">
          {/* Ward Progress Bar Chart */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className="section-label mb-4">
              <span className="heading-md">Ward Target Completion (%)</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={progressData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                <XAxis dataKey="ward" tick={{ fill: '#7a9bb5', fontSize: 9 }} angle={-15} textAnchor="end" interval={0}/>
                <YAxis tick={{ fill: '#7a9bb5', fontSize: 10 }} domain={[0, 100]}/>
                <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--glass-border)', borderRadius: 8 }}/>
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }}/>
                {policy.params.trees > 0 && <Bar dataKey="trees" fill="var(--accent-green)" opacity={0.8} radius={[3, 3, 0, 0]} name="Trees Progress %"/>}
                {policy.params.coolRoofs > 0 && <Bar dataKey="roofs" fill="var(--accent-cyan)"  opacity={0.8} radius={[3, 3, 0, 0]} name="Roofs Progress %"/>}
                {policy.params.waterStations > 0 && <Bar dataKey="water" fill="var(--accent-teal)"  opacity={0.8} radius={[3, 3, 0, 0]} name="Water Progress %"/>}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Allocation Pie */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className="section-label mb-4">
              <span className="heading-md">Target Resource Allocation (%)</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
                  dataKey="value" stroke="none" paddingAngle={3}>
                  {allocationData.map((e, i) => (
                    <Cell key={i} fill={e.color} opacity={0.85}/>
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--glass-border)', borderRadius: 8 }}/>
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly activity */}
          <div className="glass-panel" style={{ padding: 24, gridColumn: '1/-1' }}>
            <div className="section-label mb-4">
              <span className="heading-md">Simulated Weekly Activity Progress</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                <XAxis dataKey="week" tick={{ fill: '#7a9bb5', fontSize: 10 }}/>
                <YAxis tick={{ fill: '#7a9bb5', fontSize: 10 }}/>
                <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--glass-border)', borderRadius: 8 }}/>
                {policy.params.trees > 0 && <Line type="monotone" dataKey="trees" stroke="var(--accent-green)" strokeWidth={2} dot={{ fill: 'var(--accent-green)', r: 3 }} name="Trees Planted / Wk"/>}
                {policy.params.coolRoofs > 0 && <Line type="monotone" dataKey="roofs" stroke="var(--accent-cyan)" strokeWidth={2} dot={{ fill: 'var(--accent-cyan)', r: 3 }} name="Cool Roofs Done / Wk"/>}
                {policy.params.waterStations > 0 && <Line type="monotone" dataKey="water" stroke="var(--accent-teal)" strokeWidth={2} dot={{ fill: 'var(--accent-teal)', r: 3 }} name="Water Stations Installed / Wk"/>}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
