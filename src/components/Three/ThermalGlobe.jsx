import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

export default function ThermalGlobe() {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Scene ──
    const scene = new THREE.Scene();

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Wireframe Sphere (city globe) ──
    const sphereGeo = new THREE.SphereGeometry(1, 40, 40);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // ── Inner Glow Sphere ──
    const innerGeo = new THREE.SphereGeometry(0.97, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x080d14,
      transparent: true,
      opacity: 0.85,
    });
    scene.add(new THREE.Mesh(innerGeo, innerMat));

    // ── Latitude / Longitude Grid Lines ──
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.12 });
    // Latitude rings (like parallels on a globe)
    for (let lat = -75; lat <= 75; lat += 25) {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const r = Math.sin(phi);
      const y = Math.cos(phi);
      const ringGeo = new THREE.BufferGeometry();
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const t = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(t), y, r * Math.sin(t)));
      }
      ringGeo.setFromPoints(pts);
      scene.add(new THREE.Line(ringGeo, lineMat));
    }
    // Longitude meridians
    for (let lng = 0; lng < 360; lng += 30) {
      const theta = THREE.MathUtils.degToRad(lng);
      const merGeo = new THREE.BufferGeometry();
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        pts.push(new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        ));
      }
      merGeo.setFromPoints(pts);
      scene.add(new THREE.Line(merGeo, lineMat));
    }

    // ── Heat Hotspot Particles (surface-mapped) ──
    // Simulate Bengaluru's major urban heat concentrations
    const HEAT_COORDS = [
      { lat: 12.97, lng: 77.59 },  // City centre
      { lat: 12.93, lng: 77.62 },  // Koramangala
      { lat: 12.97, lng: 77.75 },  // Whitefield
      { lat: 12.92, lng: 77.58 },  // Jayanagar
      { lat: 13.10, lng: 77.59 },  // Yelahanka
      { lat: 13.00, lng: 77.57 },  // Malleswaram
      { lat: 13.04, lng: 77.60 },  // Hebbal
      { lat: 12.95, lng: 77.59 },  // Lalbagh
      { lat: 12.91, lng: 77.61 },  // BTM Layout
      { lat: 12.91, lng: 77.64 },  // HSR Layout
      { lat: 12.85, lng: 77.66 },  // Electronic City
      { lat: 12.96, lng: 77.70 },  // Marathahalli
    ];

    // Helper: convert lat/lng to 3D point on unit sphere
    const latLngToVec3 = (lat, lng, r = 1.01) => {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lng - 77.5); // center on Bengaluru's longitude
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };

    // Create a glowing disc for each heat hotspot
    const hotspotGroup = new THREE.Group();
    const hotspotMeshes = [];
    HEAT_COORDS.forEach((coord, i) => {
      const pos = latLngToVec3(coord.lat, coord.lng);
      // Halo ring
      const haloGeo = new THREE.RingGeometry(0.04, 0.08, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: i < 4 ? 0xff1744 : i < 8 ? 0xff6d00 : 0xffb300,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(pos);
      halo.lookAt(pos.clone().multiplyScalar(2)); // face outward

      // Core dot
      const dotGeo = new THREE.CircleGeometry(0.025, 12);
      const dotMat = new THREE.MeshBasicMaterial({
        color: i < 4 ? 0xff1744 : i < 8 ? 0xff6d00 : 0xffb300,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.lookAt(pos.clone().multiplyScalar(2));

      hotspotGroup.add(halo, dot);
      hotspotMeshes.push({ halo, dot, phase: (i / HEAT_COORDS.length) * Math.PI * 2 });
    });
    scene.add(hotspotGroup);

    // ── Outer glow particles (ambient heat haze) ──
    const PARTICLE_COUNT = 1800;
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.15 + Math.random() * 0.45;
      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);
      // Heat colour gradient: red/orange/amber
      const t = Math.random();
      particleColors[i * 3] = 1.0;
      particleColors[i * 3 + 1] = t * 0.55;
      particleColors[i * 3 + 2] = 0.0;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Equatorial Accent Ring ──
    const ringGeo = new THREE.RingGeometry(1.18, 1.22, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // ── Mouse Interaction (tilt on mouse move) ──
    const mouse = { x: 0, y: 0 };
    const targetRotation = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      gsap.to(targetRotation, {
        x: mouse.y * 0.3,
        y: mouse.x * 0.5,
        duration: 1.5,
        ease: 'power2.out',
      });
    };
    mount.addEventListener('mousemove', onMouseMove);

    // ── GSAP entrance animation ──
    gsap.from(sphere.rotation, { y: -Math.PI * 2, duration: 4, ease: 'power3.out' });
    gsap.from(sphereMat, { opacity: 0, duration: 1.5, ease: 'power2.out' });
    gsap.from(particleMat, { opacity: 0, duration: 2, ease: 'power2.out', delay: 0.5 });

    // ── Animation Loop ──
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.005;

      // Slow auto-rotate
      sphere.rotation.y += 0.0025;
      hotspotGroup.rotation.y += 0.0025;
      particles.rotation.y -= 0.0008;

      // Apply mouse-based tilt
      sphere.rotation.x += (targetRotation.x - sphere.rotation.x) * 0.04;
      hotspotGroup.rotation.x += (targetRotation.x - hotspotGroup.rotation.x) * 0.04;

      // Animate hotspot pulsing
      hotspotMeshes.forEach(({ halo, dot, phase }) => {
        const pulse = 0.7 + 0.3 * Math.sin(t * 2.5 + phase);
        halo.material.opacity = pulse * 0.7;
        const sc = 0.85 + 0.15 * Math.sin(t * 3 + phase);
        halo.scale.setScalar(sc);
      });

      // Particle shimmer
      particleMat.opacity = 0.35 + 0.2 * Math.sin(t * 0.5);

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize Handler ──
    const onResize = () => {
      const nW = mount.clientWidth;
      const nH = mount.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        borderRadius: 'inherit',
      }}
    />
  );
}
