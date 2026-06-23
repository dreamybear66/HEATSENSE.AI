import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Home.css';
import BengaluruMap from '../components/Map/BengaluruMap';
import ThermalGlobe from '../components/Three/ThermalGlobe';
import HeatDataOrbit from '../components/Three/HeatDataOrbit';

gsap.registerPlugin(ScrollTrigger);

/* ---- Synthetic data ---- */
const heatTrend = Array.from({length: 24}, (_, i) => ({
  hour: `${String(i).padStart(2,'0')}:00`,
  lst:  32 + Math.sin(i * 0.4) * 6 + Math.random() * 2,
  ndvi: 0.3 + Math.sin(i * 0.3 + 1) * 0.12 + Math.random() * 0.03,
}));

const RISK_COLOR = { critical:'#ff1744', high:'#ff6d00', moderate:'#ffb300', safe:'#00e676' };

const STATS = [
  { value:'198', label:'Wards Analyzed', unit:'', color:'var(--accent-cyan)' },
  { value:'47',  label:'Critical Zones', unit:'', color:'var(--accent-red)' },
  { value:'8.4M', label:'Citizens at Risk', unit:'', color:'var(--accent-amber)' },
  { value:'41.2', label:'Peak Heat Index', unit:'°C', color:'var(--accent-orange)' },
];

const FEATURES = [
  {
    icon: '⬡',
    title: 'Heat Zone Clustering',
    desc: 'K-Means algorithm segments 198 city wards into risk tiers using satellite-derived Land Surface Temperature and NDVI data.',
    code: 'K-MEANS',
    color: 'var(--accent-red)',
  },
  {
    icon: '◈',
    title: 'Intervention Engine',
    desc: 'Rule-based 2×2 matrix prescribes targeted actions — tree planting, cool roofs, EV corridors — per zone.',
    code: 'RULE-ML',
    color: 'var(--accent-amber)',
  },
  {
    icon: '◉',
    title: 'Priority Scoring',
    desc: 'Composite score = heat severity × population density × green deficit. Ranks zones for resource allocation.',
    code: 'OPT-SCORE',
    color: 'var(--accent-cyan)',
  },
  {
    icon: '◆',
    title: 'What-If Simulation',
    desc: 'Planners adjust tree cover, EV adoption, and roof albedo to simulate 5-year temperature reduction outcomes.',
    code: 'SIM-5Y',
    color: 'var(--accent-teal)',
  },
];

/* ---- Custom Tooltip ---- */
const HeatTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label mono">{label}</div>
      <div className="chart-tooltip__row">
        <span style={{color:'#ff6d00'}}>LST</span>
        <strong>{payload[0]?.value?.toFixed(1)}°C</strong>
      </div>
      <div className="chart-tooltip__row">
        <span style={{color:'#00e676'}}>NDVI</span>
        <strong>{payload[1]?.value?.toFixed(3)}</strong>
      </div>
    </div>
  );
};

/* ---- SVG City Grid Map ---- */
function CityGrid({ wards }) {
  const [hovered, setHovered] = useState(null);
  const minLat = 12.85, maxLat = 13.12, minLng = 77.55, maxLng = 77.77;
  const W = 360, H = 260;
  const toX = lng => ((lng - minLng) / (maxLng - minLng)) * (W - 40) + 20;
  const toY = lat => ((maxLat - lat) / (maxLat - minLat)) * (H - 40) + 20;

  return (
    <div className="city-grid-wrapper">
      <svg viewBox={`0 0 ${W} ${H}`} className="city-grid-svg">
        {Array.from({length:8}, (_,i) => (
          <line key={`vl-${i}`} x1={20 + i*46} y1={10} x2={20 + i*46} y2={H-10}
            stroke="rgba(0,229,255,0.05)" strokeWidth="1"/>
        ))}
        {Array.from({length:6}, (_,i) => (
          <line key={`hl-${i}`} x1={10} y1={20 + i*40} x2={W-10} y2={20 + i*40}
            stroke="rgba(0,229,255,0.05)" strokeWidth="1"/>
        ))}
        {wards.map(w => {
          const x = toX(w.lng), y = toY(w.lat);
          const r = Math.max(12, Math.min(24, w.pop / 6000));
          const col = RISK_COLOR[w.risk];
          const isHov = hovered === w.id;
          return (
            <g key={w.id} onMouseEnter={() => setHovered(w.id)} onMouseLeave={() => setHovered(null)}>
              <circle cx={x} cy={y} r={r + 6} fill={col} opacity={0.08}
                className="ward-pulse-ring"/>
              <circle cx={x} cy={y} r={r} fill={col} opacity={isHov ? 0.85 : 0.55}
                stroke={col} strokeWidth={isHov ? 2 : 1}/>
              <text x={x} y={y+3} textAnchor="middle" fontSize="8"
                fill="white" fontFamily="var(--font-mono)" fontWeight="600">
                {w.heat.toFixed(0)}°
              </text>
              {isHov && (
                <text x={x} y={y + r + 12} textAnchor="middle" fontSize="9"
                  fill={col} fontFamily="var(--font-body)" fontWeight="600">
                  {w.name}
                </text>
              )}
            </g>
          );
        })}
        <line x1={0} y1={0} x2={W} y2={0} stroke="rgba(0,229,255,0.4)"
          strokeWidth="1.5" className="map-scan-line"/>
      </svg>
      <div className="city-grid-legend">
        {Object.entries(RISK_COLOR).map(([k, v]) => (
          <div key={k} className="city-grid-legend-item">
            <span style={{background: v, width:8, height:8, borderRadius:'50%', display:'block'}}/>
            <span className="label" style={{color:'var(--text-secondary)'}}>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ */
export default function Home() {
  const [counter, setCounter] = useState(0);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);

  /* GSAP refs */
  const heroContentRef = useRef(null);
  const heroGlobeRef   = useRef(null);
  const statsRef       = useRef(null);
  const chartRef       = useRef(null);
  const featureRefs    = useRef([]);
  const ctaRef         = useRef(null);
  const globeSectionRef = useRef(null);

  useEffect(() => {
    // Fetch real wards data
    fetch('http://localhost:8000/api/zones')
      .then(res => res.json())
      .then(data => { data.sort((a, b) => b.heat - a.heat); setWards(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Counter animation
    let frame;
    const animate = () => { setCounter(c => c < 100 ? c + 1 : 100); frame = setTimeout(animate, 18); };
    frame = setTimeout(animate, 200);

    // ── GSAP Hero entrance ──
    const heroCtx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('.hero__eyebrow',   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 })
        .fromTo('.hero__title',     { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
        .fromTo('.hero__desc',      { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .fromTo('.hero__actions',   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .fromTo('.hero__scan',      { opacity: 0 },        { opacity: 1, duration: 0.5 },        '-=0.3')
        .fromTo('.hero__map',       { opacity: 0, x: 60, rotateY: 15 }, { opacity: 1, x: 0, rotateY: 0, duration: 1.1 }, '-=0.9');
    });

    // ── GSAP ScrollTrigger: Stats ──
    gsap.fromTo('.stats-strip__item',
      { opacity: 0, y: 50, scale: 0.9 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.7, stagger: 0.12, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: '.stats-strip', start: 'top 85%', toggleActions: 'play none none none' },
      }
    );

    // ── GSAP ScrollTrigger: Globe section ──
    gsap.fromTo('.globe-section',
      { opacity: 0, y: 60 },
      {
        opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.globe-section', start: 'top 80%', toggleActions: 'play none none none' },
      }
    );

    // ── Parallax float on globe canvas ──
    gsap.to('.globe-canvas-wrapper', {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.globe-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    // ── GSAP ScrollTrigger: Chart ──
    gsap.fromTo('.chart-reveal',
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: '.chart-reveal', start: 'top 82%', toggleActions: 'play none none none' },
      }
    );

    // ── GSAP ScrollTrigger: Feature cards ──
    gsap.fromTo('.feature-card',
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.75, stagger: 0.14, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: '.features-grid', start: 'top 83%', toggleActions: 'play none none none' },
      }
    );

    // ── GSAP ScrollTrigger: CTA ──
    gsap.fromTo('.cta-card',
      { opacity: 0, scale: 0.92 },
      {
        opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: '.cta-section', start: 'top 85%', toggleActions: 'play none none none' },
      }
    );

    return () => {
      clearTimeout(frame);
      heroCtx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="home">
      {/* Background effects */}
      <div className="grid-bg"/>
      <div className="scanlines"/>
      <div className="glow-orb" style={{width:500, height:500, background:'rgba(255,23,68,0.07)', top:'-100px', right:'-100px'}}/>
      <div className="glow-orb" style={{width:400, height:400, background:'rgba(0,229,255,0.06)', bottom:'20%', left:'-80px', animationDelay:'3s'}}/>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__inner container">
          <div className="hero__content" ref={heroContentRef}>
            <div className="hero__eyebrow" style={{opacity:0}}>
              <span className="pulse-dot pulse-dot-red"/>
              <span className="label" style={{color:'var(--accent-red)'}}>HEATWAVE ALERT — BENGALURU</span>
              <span className="label" style={{color:'var(--text-muted)'}}>/ 47 CRITICAL ZONES DETECTED</span>
            </div>

            <h1 className="hero__title display-xl" style={{opacity:0}}>
              <span className="gradient-text-heat">Urban Heat</span>
              <br/>
              <span style={{color:'var(--text-primary)'}}>Survival</span>
              <br/>
              <span className="gradient-text">Planner</span>
            </h1>

            <p className="hero__desc body-lg" style={{opacity:0}}>
              AI-powered geospatial intelligence that identifies urban heat risk zones,
              prescribes targeted interventions, and helps city planners protect millions
              of lives — before the next heatwave.
            </p>

            <div className="hero__actions" style={{opacity:0}}>
              <Link to="/intelligence" className="btn btn-primary">
                <span>⬡</span> Launch Intelligence
              </Link>
              <Link to="/strategy" className="btn btn-secondary">
                <span>◆</span> Run Simulation
              </Link>
            </div>

            <div className="hero__scan" style={{opacity:0}}>
              <div className="hero__scan-label">
                <span className="mono" style={{fontSize:'0.7rem', color:'var(--text-secondary)'}}>SYSTEM SCAN</span>
                <span className="mono" style={{fontSize:'0.7rem', color:'var(--accent-cyan)'}}>{counter}%</span>
              </div>
              <div className="hero__scan-bar">
                <div className="hero__scan-fill" style={{width:`${counter}%`}}/>
              </div>
            </div>
          </div>

          {/* Bengaluru Map */}
          <div className="hero__map glass-panel" style={{opacity:0}} ref={heroGlobeRef}>
            <div className="hero__map-header">
              <div className="flex items-center gap-4">
                <span className="pulse-dot pulse-dot-cyan"/>
                <span className="label" style={{color:'var(--accent-cyan)'}}>BENGALURU — LIVE THERMAL SCAN</span>
              </div>
              <span className="label" style={{color:'var(--text-muted)'}}>MODIS / SENTINEL-2</span>
            </div>
            <div style={{ height: '360px' }}>
              <BengaluruMap wardsData={wards} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS STRIP ===== */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-strip__grid">
            {STATS.map((s, i) => (
              <div key={i} className="stats-strip__item glass-panel-sm" style={{opacity:0}}>
                <div className="metric-value" style={{color: s.color}}>
                  {s.value}<span style={{fontSize:'1rem'}}>{s.unit}</span>
                </div>
                <div className="metric-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THREE.JS THERMAL GLOBE SECTION ===== */}
      <section className="globe-section section" ref={globeSectionRef}>
        <div className="container">
          <div className="globe-section__header">
            <div className="section-label" style={{marginBottom:8}}>
              <span className="heading-md">Real-Time Heat Intelligence</span>
              <span className="badge badge-critical">3D ANALYSIS</span>
            </div>
            <p className="body-sm" style={{color:'var(--text-secondary)', maxWidth: 520, marginBottom: 36}}>
              Interactive globe visualising Bengaluru's urban heat hotspots mapped from satellite LST data.
              Each node represents a high-risk ward cluster. Hover to explore.
            </p>
          </div>

          <div className="globe-layout">
            {/* Three.js Globe */}
            <div className="globe-canvas-wrapper glass-panel">
              <div className="globe-header">
                <span className="pulse-dot pulse-dot-red"/>
                <span className="label" style={{color:'var(--accent-red)'}}>THERMAL HOTSPOT GLOBE</span>
                <span className="label" style={{color:'var(--text-muted)', marginLeft:'auto'}}>12 HIGH-RISK CLUSTERS</span>
              </div>
              <div style={{ height: '420px' }}>
                <ThermalGlobe />
              </div>
              <div className="globe-footer">
                <div className="globe-legend">
                  <span className="globe-legend-dot" style={{background:'#ff1744'}}/>
                  <span className="caption text-muted">Severe (&gt;39°C)</span>
                </div>
                <div className="globe-legend">
                  <span className="globe-legend-dot" style={{background:'#ff6d00'}}/>
                  <span className="caption text-muted">High (37–39°C)</span>
                </div>
                <div className="globe-legend">
                  <span className="globe-legend-dot" style={{background:'#ffb300'}}/>
                  <span className="caption text-muted">Moderate (35–37°C)</span>
                </div>
              </div>
            </div>

            {/* GSAP Floating Data Nodes */}
            <div className="globe-side-panel">
              <div className="section-label" style={{marginBottom:16}}>
                <span className="mono" style={{fontSize:'0.7rem', letterSpacing:'0.12em', color:'var(--accent-cyan)'}}>LIVE METRICS</span>
              </div>
              <HeatDataOrbit />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HEAT TREND CHART ===== */}
      <section className="section container chart-reveal" style={{opacity:0}}>
        <div className="section-label">
          <span className="heading-md">24-Hour Thermal Profile</span>
          <span className="badge badge-critical">LIVE DATA</span>
        </div>
        <p className="body-sm" style={{color:'var(--text-secondary)', marginBottom:24}}>
          Land Surface Temperature vs. vegetation index over a 24-hour cycle across monitored wards.
        </p>
        <div className="glass-panel" style={{padding:'24px', height:300}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={heatTrend}>
              <defs>
                <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff6d00" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ff6d00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00e676" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00e676" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)"/>
              <XAxis dataKey="hour" tick={{fill:'#7a9bb5', fontSize:10, fontFamily:'JetBrains Mono'}} interval={3}/>
              <YAxis yAxisId="left" tick={{fill:'#7a9bb5', fontSize:10}} domain={[26, 48]}/>
              <YAxis yAxisId="right" orientation="right" tick={{fill:'#7a9bb5', fontSize:10}} domain={[0.1, 0.7]}/>
              <Tooltip content={<HeatTooltip/>}/>
              <Area yAxisId="left" type="monotone" dataKey="lst"
                stroke="#ff6d00" fill="url(#heatGrad)" strokeWidth={2} name="LST °C"/>
              <Area yAxisId="right" type="monotone" dataKey="ndvi"
                stroke="#00e676" fill="url(#ndviGrad)" strokeWidth={2} name="NDVI"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== WARD TABLE ===== */}
      <section className="section container">
        <div className="section-label">
          <span className="heading-md">Priority Ward Rankings</span>
        </div>
        <div className="ward-table glass-panel">
          <div className="ward-table__header">
            <span>Rank</span><span>Ward</span><span>LST</span>
            <span>NDVI</span><span>Population</span><span>Risk</span>
          </div>
          {loading ? (
            <div style={{padding: 20, textAlign: 'center', color: 'var(--text-muted)'}}>Loading real-time API data...</div>
          ) : (
            wards.slice(0, 10).map((w, i) => (
              <div key={w.id} className="ward-table__row">
                <span className="mono" style={{color:'var(--text-muted)'}}>#{String(i+1).padStart(2,'0')}</span>
                <span style={{fontWeight:600}}>{w.name}</span>
                <span className="mono" style={{color: w.heat > 40 ? 'var(--accent-red)' : w.heat > 37 ? 'var(--accent-orange)' : 'var(--accent-amber)'}}>
                  {w.heat}°C
                </span>
                <span className="mono" style={{color:'var(--accent-green)'}}>{w.ndvi.toFixed(2)}</span>
                <span className="mono" style={{color:'var(--text-secondary)'}}>{(w.pop/1000).toFixed(0)}K</span>
                <span className={`badge badge-${w.risk}`}>{w.risk}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="section container">
        <div className="section-label">
          <span className="heading-md">Platform Capabilities</span>
        </div>
        <div className="grid-2 features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card glass-panel" style={{opacity:0}}>
              <div className="feature-card__icon" style={{color: f.color}}>{f.icon}</div>
              <div className="feature-card__body">
                <div className="flex items-center gap-4 mb-4">
                  <span className="heading-md">{f.title}</span>
                  <span className="badge badge-info">{f.code}</span>
                </div>
                <p style={{color:'var(--text-secondary)', fontSize:'0.9rem', lineHeight:1.7}}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-panel" style={{opacity:0}}>
            <div className="cta-card__glow"/>
            <h2 className="display-md gradient-text">Ready to protect your city?</h2>
            <p style={{color:'var(--text-secondary)', maxWidth:480, margin:'12px auto 24px'}}>
              Explore 198 Bengaluru wards, run intervention simulations, and generate policy reports in minutes.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/intelligence" className="btn btn-primary">Open Intelligence →</Link>
              <Link to="/logistics" className="btn btn-secondary">View Operations</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
