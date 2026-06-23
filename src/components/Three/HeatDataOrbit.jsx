import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const METRICS = [
  { value: '39.2°C', label: 'Whitefield UHI', color: '#ff1744' },
  { value: '37.8°C', label: 'Koramangala UHI', color: '#ff4b00' },
  { value: '-2.4°C', label: 'ML Projection', color: '#00e5ff' },
  { value: '1.8M', label: 'Population at Risk', color: '#ffb300' },
  { value: '94%', label: 'Canopy Coverage Needed', color: '#00ffa3' },
  { value: '62', label: 'High-Risk Wards', color: '#ff6d00' },
  { value: '14.6MW', label: 'AC Peak Load', color: '#e040fb' },
  { value: '3.2°C', label: 'Night Cooling Gap', color: '#00b0ff' },
];

export default function HeatDataOrbit() {
  const containerRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const nodes = nodesRef.current.filter(Boolean);

    // Initial state: invisible, scattered
    gsap.set(nodes, { opacity: 0, scale: 0.4, y: 60 });

    // Staggered entrance
    gsap.to(nodes, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'back.out(1.6)',
      delay: 0.8,
    });

    // Continuous float animations — each node drifts independently
    nodes.forEach((node, i) => {
      const yRange = 10 + (i % 3) * 5;
      const duration = 2.8 + (i % 4) * 0.7;
      gsap.to(node, {
        y: `+=${yRange}`,
        duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.2,
      });

      // Subtle horizontal sway
      gsap.to(node, {
        x: `+=${8 + (i % 3) * 4}`,
        duration: duration * 1.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.15,
      });

      // Pulse glow on the value text
      const valueEl = node.querySelector('.orbit-value');
      if (valueEl) {
        gsap.to(valueEl, {
          textShadow: `0 0 18px currentColor`,
          duration: 1.2 + i * 0.1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.18,
        });
      }
    });

    // Hover effects
    nodes.forEach((node) => {
      node.addEventListener('mouseenter', () => {
        gsap.to(node, { scale: 1.08, duration: 0.3, ease: 'power2.out' });
      });
      node.addEventListener('mouseleave', () => {
        gsap.to(node, { scale: 1, duration: 0.3, ease: 'power2.out' });
      });
    });

    return () => {
      gsap.killTweensOf(nodes);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="heat-orbit-grid"
    >
      {METRICS.map((m, i) => (
        <div
          key={i}
          className="heat-orbit-node glass"
          ref={(el) => (nodesRef.current[i] = el)}
        >
          <span
            className="orbit-value mono"
            style={{ color: m.color }}
          >
            {m.value}
          </span>
          <span className="orbit-label caption text-muted">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
