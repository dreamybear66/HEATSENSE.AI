import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import './Logistics.css';

/* ---- Gantt data ---- */
const GANTT_TASKS = [
  { id:1, name:'Ward Survey & Mapping',    team:'GIS Unit',       start:0, dur:2, color:'#00e5ff', status:'completed' },
  { id:2, name:'Tree Planting — Zone C0',  team:'Green Corps',    start:1, dur:3, color:'#00e676', status:'active' },
  { id:3, name:'Cool Roof — Koramangala',  team:'Infra Unit A',   start:2, dur:4, color:'#ffb300', status:'active' },
  { id:4, name:'EV Bus Corridor — NH44',   team:'Transport Dept', start:3, dur:5, color:'#7c4dff', status:'active' },
  { id:5, name:'Water Station Install',    team:'BBMP Works',     start:2, dur:3, color:'#1de9b6', status:'completed' },
  { id:6, name:'Cool Roof — Whitefield',   team:'Infra Unit B',   start:5, dur:4, color:'#ffb300', status:'planned' },
  { id:7, name:'Tree Planting — Zone C1',  team:'Green Corps',    start:4, dur:4, color:'#00e676', status:'planned' },
  { id:8, name:'Misting Points — 20 Sites',team:'BBMP Works',     start:6, dur:2, color:'#1de9b6', status:'planned' },
];
const GANTT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---- Fleet data ---- */
const FLEET = [
  { id:'GC-01', type:'Planting Vehicle', ward:'Koramangala', lat:12.934, lng:77.626, status:'active',   trees:120 },
  { id:'GC-02', type:'Planting Vehicle', ward:'Whitefield',  lat:12.968, lng:77.750, status:'active',   trees:95  },
  { id:'IR-01', type:'Cool Roof Crew',   ward:'Jayanagar',   lat:12.924, lng:77.582, status:'transit',  trees:0   },
  { id:'WS-01', type:'Water Station',    ward:'Yelahanka',   lat:13.100, lng:77.594, status:'installed',trees:0   },
  { id:'WS-02', type:'Water Station',    ward:'Hebbal',      lat:13.035, lng:77.597, status:'transit',  trees:0   },
  { id:'EV-01', type:'EV Bus',           ward:'Malleswaram', lat:13.003, lng:77.565, status:'active',   trees:0   },
];

/* ---- Live intervention log ---- */
const INITIAL_LOG = [
  { id:1,  ts:'01:17:32', event:'Tree planted at Koramangala Sector 4',        type:'tree',   ward:'Koramangala', severity:'info' },
  { id:2,  ts:'01:15:11', event:'Cool roof installation completed — Block 12',  type:'roof',   ward:'Whitefield',  severity:'success' },
  { id:3,  ts:'01:12:48', event:'Water station GC-WS-04 online',               type:'water',  ward:'Yelahanka',   severity:'success' },
  { id:4,  ts:'01:10:02', event:'LST spike detected: 44.2°C — Priority alert', type:'alert',  ward:'Koramangala', severity:'critical' },
  { id:5,  ts:'01:08:55', event:'EV Bus route 47 electrified',                  type:'ev',     ward:'Malleswaram', severity:'info' },
  { id:6,  ts:'01:06:30', event:'Tree mortality detected — sector 2 replant',  type:'alert',  ward:'Jayanagar',   severity:'warning' },
  { id:7,  ts:'01:04:12', event:'Cool roof survey completed — 48 buildings',   type:'roof',   ward:'Hebbal',      severity:'info' },
  { id:8,  ts:'01:01:59', event:'Misting station activated — 12 locations',    type:'water',  ward:'BTM Layout',  severity:'success' },
];

const LOG_ICON = { tree:'🌳', roof:'🏠', water:'💧', ev:'🚌', alert:'⚠️' };
const LOG_SEVERITY_CLASS = { info:'log-info', success:'log-success', warning:'log-warning', critical:'log-critical' };

/* ---- Progress data ---- */
const progressData = [
  { ward:'Koramangala', trees:67, roofs:42, water:80 },
  { ward:'Whitefield',  trees:51, roofs:73, water:60 },
  { ward:'Jayanagar',   trees:80, roofs:55, water:45 },
  { ward:'Yelahanka',   trees:39, roofs:28, water:90 },
  { ward:'Malleswaram', trees:72, roofs:61, water:70 },
];

const allocationData = [
  { name:'Tree Planting', value:35, color:'#00e676' },
  { name:'Cool Roofs',    value:28, color:'#00e5ff' },
  { name:'EV Buses',      value:22, color:'#7c4dff' },
  { name:'Water Stations',value:15, color:'#1de9b6' },
];

const weeklyProgress = Array.from({length:12}, (_,i) => ({
  week: `W${i+1}`,
  trees:   Math.round(80 + Math.random()*40),
  roofs:   Math.round(5  + Math.random()*8),
  water:   Math.round(1  + Math.random()*3),
}));

/* ---- Fleet Map (SVG) ---- */
function FleetMap({ fleet }) {
  const W=380, H=240;
  const minLat=12.85, maxLat=13.12, minLng=77.55, maxLng=77.77;
  const toX = lng => ((lng-minLng)/(maxLng-minLng))*(W-60)+30;
  const toY = lat => ((maxLat-lat)/(maxLat-minLat))*(H-40)+20;
  const SCOL = { active:'#00e676', transit:'#ffb300', installed:'#00e5ff', planned:'#7a9bb5' };
  const ICON = { 'Planting Vehicle':'🌳', 'Cool Roof Crew':'🏠', 'Water Station':'💧', 'EV Bus':'🚌' };
  return (
    <div className="fleet-map">
      <div className="fleet-map__label">
        <span className="label" style={{color:'var(--accent-cyan)'}}>⬡ FLEET POSITIONS — REAL-TIME</span>
        <span className="pulse-dot pulse-dot-green"/>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block'}}>
        {Array.from({length:7}, (_,i) => (
          <line key={`v${i}`} x1={30+i*50} y1={15} x2={30+i*50} y2={H-15}
            stroke="rgba(0,229,255,0.04)" strokeWidth="1"/>
        ))}
        {Array.from({length:5}, (_,i) => (
          <line key={`h${i}`} x1={20} y1={20+i*50} x2={W-20} y2={20+i*50}
            stroke="rgba(0,229,255,0.04)" strokeWidth="1"/>
        ))}
        {fleet.map(v => {
          const x=toX(v.lng), y=toY(v.lat);
          const col = SCOL[v.status] || '#7a9bb5';
          return (
            <g key={v.id}>
              <circle cx={x} cy={y} r={14} fill={col} opacity={0.12}/>
              <circle cx={x} cy={y} r={8} fill={col} opacity={0.3} stroke={col} strokeWidth={1}/>
              <text x={x} y={y+4} textAnchor="middle" fontSize="10">{ICON[v.type]||'○'}</text>
              <text x={x} y={y+20} textAnchor="middle" fontSize="7.5" fill={col}
                fontFamily="var(--font-mono)">{v.id}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================ */
export default function Logistics() {
  const [log, setLog] = useState(INITIAL_LOG);
  const [tick, setTick] = useState(0);

  // Simulate live log entries
  useEffect(() => {
    const events = [
      'Sensor calibrated at ward boundary',
      'Tree watering cycle completed',
      'Cool roof reflectivity measured: 0.82',
      'EV charging station online',
      'LST reading: 38.4°C — nominal',
    ];
    const wards = ['Koramangala','Whitefield','Jayanagar','Malleswaram'];
    const types = ['tree','roof','ev','water','alert'];
    const sev   = ['info','success','info','info','info'];
    const interval = setInterval(() => {
      const now = new Date();
      const ts = now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      const idx = Math.floor(Math.random() * events.length);
      setLog(prev => [{
        id: Date.now(),
        ts,
        event: events[idx],
        type: types[idx],
        ward: wards[Math.floor(Math.random()*wards.length)],
        severity: sev[idx],
      }, ...prev.slice(0,19)]);
      setTick(t => t+1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="logistics page-wrapper">
      <div className="grid-bg"/>
      <div className="glow-orb" style={{width:400,height:400,background:'rgba(0,230,118,0.04)',top:'30%',right:'-80px'}}/>

      {/* PAGE HEADER */}
      <div className="page-header container">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="badge badge-safe">OPS ACTIVE</span>
            <span className="badge badge-info">6 UNITS DEPLOYED</span>
          </div>
          <h1 className="display-md">Logistics Center</h1>
          <p style={{color:'var(--text-secondary)', marginTop:8}}>
            Gantt-based deployment tracking, fleet positioning, and real-time intervention logs.
          </p>
        </div>
        <div className="flex gap-4">
          {[
            {v:'47', l:'Trees Today', c:'var(--accent-green)'},
            {v:'3',  l:'Roofs Done',  c:'var(--accent-cyan)'},
            {v:'6',  l:'Fleet Active',c:'var(--accent-teal)'},
            {v:tick, l:'Log Events',  c:'var(--accent-amber)'},
          ].map((m,i) => (
            <div key={i} className="metric-card" style={{minWidth:120}}>
              <div className="metric-value" style={{color:m.c, fontSize:'1.6rem'}}>{m.v}</div>
              <div className="metric-label">{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        {/* ===== GANTT CHART ===== */}
        <div className="glass-panel mb-6" style={{overflow:'hidden'}}>
          <div className="gantt-header">
            <div className="section-label" style={{marginBottom:0}}>
              <span className="heading-md">Deployment Gantt — 2025</span>
            </div>
            <div className="flex gap-4">
              {['completed','active','planned'].map(s => (
                <div key={s} className="flex items-center gap-4">
                  <span className={`badge badge-${s==='completed'?'safe':s==='active'?'info':'moderate'}`}>{s}</span>
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
            {GANTT_TASKS.map(task => (
              <div key={task.id} className="gantt-row">
                <div className="gantt-task-info">
                  <span className="body-sm" style={{fontWeight:500}}>{task.name}</span>
                  <span className="mono" style={{fontSize:'0.65rem', color:'var(--text-muted)'}}>{task.team}</span>
                </div>
                <div className="gantt-track">
                  <div className="gantt-bar"
                    style={{
                      left:`${(task.start/12)*100}%`,
                      width:`${(task.dur/12)*100}%`,
                      background: task.color,
                      opacity: task.status==='planned' ? 0.35 : task.status==='active' ? 0.8 : 0.55,
                      boxShadow: task.status==='active' ? `0 0 10px ${task.color}80` : 'none',
                    }}>
                    <span className="mono" style={{fontSize:'0.62rem', color:'rgba(0,0,0,0.8)', fontWeight:700, padding:'0 6px'}}>
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
          <div className="glass-panel" style={{overflow:'hidden'}}>
            <FleetMap fleet={FLEET}/>
            <div className="fleet-list">
              {FLEET.map(v => (
                <div key={v.id} className="fleet-row">
                  <span className="mono body-sm" style={{color:'var(--accent-cyan)'}}>{v.id}</span>
                  <span className="body-sm">{v.type}</span>
                  <span className="body-sm" style={{color:'var(--text-secondary)'}}>{v.ward}</span>
                  <span className={`badge badge-${v.status==='active'?'safe':v.status==='installed'?'info':'moderate'}`}>
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Log */}
          <div className="glass-panel" style={{display:'flex', flexDirection:'column'}}>
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
                  className={`log-entry ${LOG_SEVERITY_CLASS[entry.severity]} ${i===0?'log-entry--new':''}`}>
                  <span className="log-entry__icon">{LOG_ICON[entry.type]}</span>
                  <div className="log-entry__body">
                    <div className="log-entry__event">{entry.event}</div>
                    <div className="log-entry__meta">
                      <span className="mono">{entry.ts}</span>
                      <span>·</span>
                      <span style={{color:'var(--text-muted)'}}>{entry.ward}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${entry.severity==='critical'?'critical':entry.severity==='warning'?'high':entry.severity==='success'?'safe':'info'}`}>
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
          <div className="glass-panel" style={{padding:24}}>
            <div className="section-label mb-4">
              <span className="heading-md">Ward Completion (%) per Intervention</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={progressData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                <XAxis dataKey="ward" tick={{fill:'#7a9bb5', fontSize:9}} angle={-15} textAnchor="end" interval={0}/>
                <YAxis tick={{fill:'#7a9bb5', fontSize:10}} domain={[0,100]}/>
                <Tooltip contentStyle={{background:'var(--bg-panel)',border:'1px solid var(--glass-border)',borderRadius:8}}/>
                <Legend wrapperStyle={{fontSize:11, color:'var(--text-secondary)'}}/>
                <Bar dataKey="trees" fill="var(--accent-green)" opacity={0.8} radius={[3,3,0,0]} name="Trees %"/>
                <Bar dataKey="roofs" fill="var(--accent-cyan)"  opacity={0.8} radius={[3,3,0,0]} name="Roofs %"/>
                <Bar dataKey="water" fill="var(--accent-teal)"  opacity={0.8} radius={[3,3,0,0]} name="Water %"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Allocation Pie */}
          <div className="glass-panel" style={{padding:24}}>
            <div className="section-label mb-4">
              <span className="heading-md">Budget Allocation</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
                  dataKey="value" stroke="none" paddingAngle={3}>
                  {allocationData.map((e, i) => (
                    <Cell key={i} fill={e.color} opacity={0.85}/>
                  ))}
                </Pie>
                <Tooltip contentStyle={{background:'var(--bg-panel)',border:'1px solid var(--glass-border)',borderRadius:8}}/>
                <Legend wrapperStyle={{fontSize:11, color:'var(--text-secondary)'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly activity */}
          <div className="glass-panel" style={{padding:24, gridColumn:'1/-1'}}>
            <div className="section-label mb-4">
              <span className="heading-md">Weekly Activity — Trees Planted</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
                <XAxis dataKey="week" tick={{fill:'#7a9bb5', fontSize:10}}/>
                <YAxis tick={{fill:'#7a9bb5', fontSize:10}}/>
                <Tooltip contentStyle={{background:'var(--bg-panel)',border:'1px solid var(--glass-border)',borderRadius:8}}/>
                <Line type="monotone" dataKey="trees" stroke="var(--accent-green)" strokeWidth={2} dot={{fill:'var(--accent-green)', r:3}} name="Trees Planted"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
