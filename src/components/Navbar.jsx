import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Navbar.css';

const NAV_ITEMS = [
  { path: '/',            label: 'Home',         icon: '⬡',  code: 'HOME' },
  { path: '/network',    label: 'Network',      icon: '◈',  code: 'NET' },
  { path: '/intelligence', label: 'Intelligence', icon: '◉',  code: 'INT' },
  { path: '/strategy',  label: 'Strategy',     icon: '◆',  code: 'STR' },
  { path: '/logistics', label: 'Logistics',    icon: '▣',  code: 'LOG' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentNav = NAV_ITEMS.find(n => n.path === location.pathname);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      {/* Logo */}
      <NavLink to="/" className="navbar__logo">
        <div className="navbar__logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,9 26,21 14,28 2,21 2,9" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5"/>
            <polygon points="14,7 21,11 21,19 14,23 7,19 7,11" fill="rgba(0,229,255,0.12)" stroke="var(--accent-cyan)" strokeWidth="1"/>
            <circle cx="14" cy="15" r="3" fill="var(--accent-cyan)"/>
            <line x1="14" y1="2" x2="14" y2="7" stroke="var(--accent-cyan)" strokeWidth="1"/>
            <line x1="26" y1="9" x2="21" y2="11" stroke="var(--accent-cyan)" strokeWidth="1"/>
            <line x1="26" y1="21" x2="21" y2="19" stroke="var(--accent-cyan)" strokeWidth="1"/>
            <line x1="14" y1="28" x2="14" y2="23" stroke="var(--accent-cyan)" strokeWidth="1"/>
            <line x1="2" y1="21" x2="7" y2="19" stroke="var(--accent-cyan)" strokeWidth="1"/>
            <line x1="2" y1="9" x2="7" y2="11" stroke="var(--accent-cyan)" strokeWidth="1"/>
          </svg>
        </div>
        <div className="navbar__logo-text">
          <span className="navbar__brand">THERMAL</span>
          <span className="navbar__brand-sub">MIND</span>
        </div>
      </NavLink>

      {/* Nav Links */}
      <ul className="navbar__links">
        {NAV_ITEMS.map(item => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              <span className="navbar__link-code mono">{item.code}</span>
              <span className="navbar__link-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Status Panel */}
      <div className="navbar__status">
        <div className="navbar__status-item">
          <span className="pulse-dot pulse-dot-green" style={{width:6,height:6}}></span>
          <span className="label" style={{color:'var(--accent-green)'}}>LIVE</span>
        </div>
        <div className="navbar__status-divider"/>
        <div className="navbar__status-time mono">
          {time.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}
        </div>
        {currentNav && (
          <>
            <div className="navbar__status-divider"/>
            <span className="label" style={{color:'var(--text-secondary)'}}>
              {currentNav.code}
            </span>
          </>
        )}
      </div>
    </nav>
  );
}
