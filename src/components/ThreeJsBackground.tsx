import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeJsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    
    camera.position.z = 20;
    
    // Create starfield particles
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positionArray = new Float32Array(starCount * 3);
    const colorArray = new Float32Array(starCount * 3);
    const sizeArray = new Float32Array(starCount);
    
    for (let i = 0; i < starCount; i++) {
      // Position stars in a sphere
      const radius = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positionArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positionArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positionArray[i * 3 + 2] = radius * Math.cos(phi);
      
      // Generate star color (blue, white, or yellow tint)
      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        // Blue-ish star
        colorArray[i * 3] = 0.7 + Math.random() * 0.3;
        colorArray[i * 3 + 1] = 0.8 + Math.random() * 0.2;
        colorArray[i * 3 + 2] = 1.0;
      } else if (colorChoice < 0.6) {
        // White-ish star
        colorArray[i * 3] = 0.9 + Math.random() * 0.1;
        colorArray[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colorArray[i * 3 + 2] = 0.9 + Math.random() * 0.1;
      } else {
        // Yellow-ish star
        colorArray[i * 3] = 1.0;
        colorArray[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colorArray[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      }
      
      // Random size with some stars being larger
      sizeArray[i] = Math.random() < 0.01 ? Math.random() * 3 + 2 : Math.random() * 1.5 + 0.5;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
    
    // Create shader material for stars
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: new THREE.TextureLoader().load('/star.png') },
        time: { value: 0.0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          
          // Twinkle effect
          float twinkle = sin(time * 0.1 + position.x * 0.5 + position.y * 0.3 + position.z * 0.2) * 0.5 + 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (0.5 + 0.5 * twinkle);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    
    // Create distant nebula particles
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaCount = 500;
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    const nebulaColors = new Float32Array(nebulaCount * 3);
    const nebulaSizes = new Float32Array(nebulaCount);
    
    for (let i = 0; i < nebulaCount; i++) {
      // Create cloud-like nebula formations
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 40;
      
      // Create spiral arm patterns
      const armWidth = 10 + Math.random() * 10;
      const spiralOffset = Math.random() * Math.PI * 2;
      const spiralTightness = 0.3 + Math.random() * 0.2;
      
      // Position in spiral
      const t = i / nebulaCount * Math.PI * 4 + spiralOffset;
      const x = Math.cos(t) * (radius + armWidth * Math.sin(t * 5));
      const y = (Math.random() - 0.5) * 15;
      const z = Math.sin(t) * (radius + armWidth * Math.sin(t * 5));
      
      nebulaPositions[i * 3] = x;
      nebulaPositions[i * 3 + 1] = y;
      nebulaPositions[i * 3 + 2] = z;
      
      // Color nebula particles (blue, purple, or magenta)
      if (i % 3 === 0) {
        // Blue nebula
        nebulaColors[i * 3] = 0.2 + Math.random() * 0.2;
        nebulaColors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
        nebulaColors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      } else if (i % 3 === 1) {
        // Purple nebula
        nebulaColors[i * 3] = 0.5 + Math.random() * 0.3;
        nebulaColors[i * 3 + 1] = 0.2 + Math.random() * 0.2;
        nebulaColors[i * 3 + 2] = 0.7 + Math.random() * 0.3;
      } else {
        // Magenta nebula
        nebulaColors[i * 3] = 0.7 + Math.random() * 0.3;
        nebulaColors[i * 3 + 1] = 0.2 + Math.random() * 0.2;
        nebulaColors[i * 3 + 2] = 0.5 + Math.random() * 0.3;
      }
      
      // Large particle size for nebula effect
      nebulaSizes[i] = 5 + Math.random() * 15;
    }
    
    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));
    nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(nebulaSizes, 1));
    
    const nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: new THREE.TextureLoader().load('/nebula.png') },
        time: { value: 0.0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          
          // Slow pulsing for nebula
          float pulse = sin(time * 0.05 + position.x * 0.01 + position.y * 0.01 + position.z * 0.01) * 0.15 + 0.85;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * pulse;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 0.6) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);
    
    // Add a few bright light sources
    const lightGeometry = new THREE.SphereGeometry(1, 16, 16);
    const lightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    // Create 3 distant suns
    const sunColors = [0x5588ff, 0xffcc33, 0xff5577];
    const suns = [];
    
    for (let i = 0; i < 3; i++) {
      const sun = new THREE.Mesh(lightGeometry, new THREE.MeshBasicMaterial({
        color: sunColors[i],
        transparent: true,
        opacity: 0.8
      }));
      
      // Position suns at different positions far away
      const angle = i * Math.PI * 2 / 3;
      sun.position.set(
        Math.cos(angle) * 150,
        (Math.random() - 0.5) * 50,
        Math.sin(angle) * 150
      );
      
      sun.scale.setScalar(3 + Math.random() * 2);
      scene.add(sun);
      suns.push(sun);
      
      // Add lens flare effect with light
      const light = new THREE.PointLight(sunColors[i], 1, 300);
      light.position.copy(sun.position);
      scene.add(light);
    }
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    let animationFrame: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      const time = clock.getElapsedTime();
      
      // Update shader uniforms
      starMaterial.uniforms.time.value = time;
      nebulaMaterial.uniforms.time.value = time;
      
      // Rotate nebula and stars slowly in opposite directions
      stars.rotation.y = time * 0.05;
      nebula.rotation.y = -time * 0.02;
      
      // Add some vertical movement
      stars.position.y = Math.sin(time * 0.1) * 2;
      nebula.position.y = Math.cos(time * 0.08) * 3;
      
      // Pulse the suns
      suns.forEach((sun, i) => {
        const pulseScale = 3 + Math.sin(time * 0.2 + i) * 0.5;
        sun.scale.setScalar(pulseScale);
      });
      
      // Slow camera rotation
      camera.position.x = Math.sin(time * 0.1) * 2;
      camera.position.y = Math.sin(time * 0.05) * 2;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of resources
      scene.clear();
      starGeometry.dispose();
      starMaterial.dispose();
      nebulaGeometry.dispose();
      nebulaMaterial.dispose();
      lightGeometry.dispose();
      lightMaterial.dispose();
      
      renderer.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
} 