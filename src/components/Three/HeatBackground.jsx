import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeatBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // transparent
    mount.appendChild(renderer.domElement);

    // Plane
    const geo = new THREE.PlaneGeometry(40, 25, 70, 50);
    // Rotate to lay flat
    geo.rotateX(-Math.PI / 2);

    // We'll update vertices
    const posAttribute = geo.getAttribute('position');
    const colors = new Float32Array(posAttribute.count * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    
    const plane = new THREE.Mesh(geo, mat);
    scene.add(plane);

    const cCool = new THREE.Color(0x00e5ff); // Cyan
    const cHot = new THREE.Color(0xff1744); // Red
    const cWarm = new THREE.Color(0xff9100); // Orange

    let time = 0;
    let frameId;

    const animate = () => {
      time += 0.015;
      
      const pos = geo.getAttribute('position');
      const col = geo.getAttribute('color');

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        
        // Complex wave to simulate heat map radiating
        const y = Math.sin(x * 0.4 + time) * Math.cos(z * 0.4 + time * 0.8) * 1.5 + 
                  Math.sin(x * 0.2 - time) * 1.0;
        
        pos.setY(i, y);

        // Map y (-2.5 to 2.5) to color
        const t = Math.max(0, Math.min(1, (y + 2.5) / 5.0));
        let color;
        if (t < 0.5) {
          color = cCool.clone().lerp(cWarm, t * 2.0);
        } else {
          color = cWarm.clone().lerp(cHot, (t - 0.5) * 2.0);
        }
        
        col.setXYZ(i, color.r, color.g, color.b);
      }
      
      pos.needsUpdate = true;
      col.needsUpdate = true;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
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
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0, // Behind page content, but above grid-bg which is -1
        pointerEvents: 'none'
      }}
    />
  );
}
