import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const BackgroundScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.2); // semi-transparent black background
    containerRef.current.appendChild(renderer.domElement);

    // Create stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
    });
    
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create Grid
    const gridSize = 20;
    const gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x0088ff, 0x001a33);
    gridHelper.position.y = -5;
    gridHelper.rotation.x = Math.PI / 6;
    scene.add(gridHelper);

    // Create animated nebula particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCnt = 3000;
    const posArray = new Float32Array(particlesCnt * 3);
    
    for (let i = 0; i < particlesCnt * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 15;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Create different colored particles
    const blueParticlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x0066ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    const purpleParticlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0x9900ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    
    const blueParticles = new THREE.Points(particlesGeometry, blueParticlesMaterial);
    const purpleParticles = new THREE.Points(particlesGeometry, purpleParticlesMaterial);
    
    scene.add(blueParticles);
    scene.add(purpleParticles);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate stars slightly
      stars.rotation.y += 0.0003;
      stars.rotation.x += 0.0001;
      
      // Move particles
      blueParticles.rotation.y += 0.0005;
      purpleParticles.rotation.x += 0.0003;
      
      // Pulse grid
      const time = Date.now() * 0.001;
      gridHelper.material.opacity = 0.5 + Math.sin(time) * 0.2;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose resources
      starsGeometry.dispose();
      starsMaterial.dispose();
      particlesGeometry.dispose();
      blueParticlesMaterial.dispose();
      purpleParticlesMaterial.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 -z-10"
      style={{ 
        pointerEvents: 'none',
      }}
    />
  );
};

export default BackgroundScene; 