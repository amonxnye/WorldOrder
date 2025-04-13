import { useEffect, useRef } from 'react';
import { 
  Engine, 
  Scene, 
  ArcRotateCamera, 
  Vector3, 
  HemisphericLight, 
  MeshBuilder, 
  StandardMaterial, 
  Texture, 
  Color3
} from '@babylonjs/core';

export default function BabylonGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Create engine & scene
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color3(0, 0, 0).toColor4(0); // Transparent background
    
    // Create camera
    const camera = new ArcRotateCamera(
      'camera', 
      -Math.PI / 2, 
      Math.PI / 2.5, 
      5, 
      new Vector3(0, 0, 0), 
      scene
    );
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 8;
    camera.wheelDeltaPercentage = 0.01;
    camera.attachControl(canvasRef.current, true);
    
    // Create light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    
    // Create earth sphere
    const earthSphere = MeshBuilder.CreateSphere('earth', { diameter: 2, segments: 64 }, scene);
    
    // Create material with earth texture
    const earthMaterial = new StandardMaterial('earthMaterial', scene);
    earthMaterial.diffuseTexture = new Texture('https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/packages/tools/playground/public/textures/earth.jpg', scene);
    earthMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    earthSphere.material = earthMaterial;
    
    // Add some rotation animation
    scene.onBeforeRenderObservable.add(() => {
      earthSphere.rotation.y += 0.002;
    });
    
    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start the engine render loop
    engine.runRenderLoop(() => {
      scene.render();
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);
  
  return (
    <div className="w-full h-full rounded-md overflow-hidden shadow-md">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
} 