import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Map data - simplified country borders
const COUNTRIES = {
  'ghana': { x: 425, y: 325, width: 20, height: 20, color: '#33AA33' },
  'nigeria': { x: 450, y: 320, width: 30, height: 25, color: '#00AA00' },
  'kenya': { x: 505, y: 340, width: 25, height: 25, color: '#AA3333' },
  'egypt': { x: 490, y: 295, width: 30, height: 30, color: '#AAAA33' },
  'ethiopia': { x: 510, y: 325, width: 25, height: 25, color: '#3333AA' },
  'custom': { x: 425, y: 325, width: 20, height: 20, color: '#AA33AA' },
};

// Simplified continents for background
const CONTINENTS = [
  { name: 'North America', path: [[200, 200], [300, 200], [350, 300], [250, 350], [200, 300]], color: '#DEDEDE' },
  { name: 'South America', path: [[250, 350], [300, 350], [320, 450], [250, 450]], color: '#DEDEDE' },
  { name: 'Europe', path: [[400, 200], [450, 200], [475, 250], [400, 275]], color: '#DEDEDE' },
  { name: 'Africa', path: [[400, 275], [500, 275], [530, 400], [450, 450], [400, 350]], color: '#DEDEDE' },
  { name: 'Asia', path: [[475, 250], [650, 200], [650, 350], [530, 400], [500, 275]], color: '#DEDEDE' },
  { name: 'Oceania', path: [[650, 350], [700, 350], [700, 420], [650, 420]], color: '#DEDEDE' },
];

// Resource locations on the map
const RESOURCES = [
  { type: 'gold', x: 420, y: 310, amount: 1000 },
  { type: 'iron', x: 450, y: 340, amount: 800 },
  { type: 'food', x: 500, y: 320, amount: 1500 },
  { type: 'wood', x: 480, y: 350, amount: 1200 },
];

// Unit types
const UNIT_TYPES = {
  citizen: { color: '#3355AA', radius: 3, speed: 1 },
  soldier: { color: '#AA3333', radius: 4, speed: 0.7 },
  diplomat: { color: '#DDAA33', radius: 3, speed: 0.8 },
};

// Define game units
type Unit = {
  id: number;
  type: keyof typeof UNIT_TYPES;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

export default function WorldMap() {
  const mapRef = useRef<HTMLCanvasElement>(null);
  const { nationName, resources, year, currentEra, unlockedTechs } = useGameStore();
  const [canvasLoaded, setCanvasLoaded] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [units, setUnits] = useState<Unit[]>([]);
  const [zoom, setZoom] = useState(1);
  
  // Animation frame reference
  const animationRef = useRef<number | null>(null);
  
  // Add units based on unlocked technologies
  useEffect(() => {
    let newUnits: Unit[] = [];
    
    // Base units everyone gets
    newUnits.push({ 
      id: 1, 
      type: 'citizen', 
      x: COUNTRIES.custom.x + 10, 
      y: COUNTRIES.custom.y + 10,
      targetX: COUNTRIES.custom.x + 10,
      targetY: COUNTRIES.custom.y + 10
    });
    
    // Add units based on unlocked techs
    if (unlockedTechs.includes('mil_national_army')) {
      for (let i = 0; i < 3; i++) {
        newUnits.push({ 
          id: 100 + i, 
          type: 'soldier', 
          x: COUNTRIES.custom.x + 5 + i * 5, 
          y: COUNTRIES.custom.y + 15,
          targetX: COUNTRIES.custom.x + 5 + i * 5,
          targetY: COUNTRIES.custom.y + 15
        });
      }
    }
    
    if (unlockedTechs.includes('econ_trade_networks')) {
      newUnits.push({ 
        id: 200, 
        type: 'diplomat', 
        x: COUNTRIES.custom.x + 15, 
        y: COUNTRIES.custom.y + 5,
        targetX: RESOURCES[0].x,
        targetY: RESOURCES[0].y
      });
    }
    
    setUnits(newUnits);
  }, [unlockedTechs]);
  
  // Get the nation ID from the name
  const getNationId = (name: string): string => {
    // Convert to lowercase and look for matches
    const nameLower = name.toLowerCase();
    for (const [id, _] of Object.entries(COUNTRIES)) {
      if (nameLower.includes(id)) return id;
    }
    return 'custom'; // Default to custom if no match
  };
  
  // Calculate influence radius based on resources
  const calculateInfluence = () => {
    const { diplomacy, economy, military } = resources;
    // Simple formula: average of key resources divided by 2 (max would be 50)
    return Math.sqrt((diplomacy + economy + military) / 3) * 2;
  };
  
  // Handle mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
    setZoom(newZoom);
  };
  
  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
  };
  
  // Handle mouse move for panning
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setMapOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Animation loop for units
  const animateUnits = () => {
    // Move units toward their targets
    setUnits(prevUnits => 
      prevUnits.map(unit => {
        const unitType = UNIT_TYPES[unit.type];
        const dx = unit.targetX - unit.x;
        const dy = unit.targetY - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 1) {
          // Move toward target
          return {
            ...unit,
            x: unit.x + (dx / dist) * unitType.speed,
            y: unit.y + (dy / dist) * unitType.speed
          };
        }
        // At target, pick a new random target near the nation
        const nationId = getNationId(nationName);
        const countryData = COUNTRIES[nationId as keyof typeof COUNTRIES] || COUNTRIES.custom;
        return {
          ...unit,
          targetX: countryData.x + Math.random() * 40 - 20,
          targetY: countryData.y + Math.random() * 40 - 20
        };
      })
    );
    
    // Request next frame
    animationRef.current = requestAnimationFrame(animateUnits);
  };
  
  // Setup animation loop
  useEffect(() => {
    // Start animation loop
    animationRef.current = requestAnimationFrame(animateUnits);
    
    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [units.length]);
  
  // Draw the map using canvas
  useEffect(() => {
    const canvas = mapRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 500;
    
    // Clear canvas
    ctx.fillStyle = '#87CEEB'; // Sky blue for oceans
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations
    ctx.save();
    ctx.translate(mapOffset.x, mapOffset.y);
    ctx.scale(zoom, zoom);
    
    // Draw continents
    CONTINENTS.forEach(continent => {
      ctx.fillStyle = continent.color;
      ctx.beginPath();
      ctx.moveTo(continent.path[0][0], continent.path[0][1]);
      
      for (let i = 1; i < continent.path.length; i++) {
        ctx.lineTo(continent.path[i][0], continent.path[i][1]);
      }
      
      ctx.closePath();
      ctx.fill();
      
      // Add continent name
      const centerX = continent.path.reduce((sum, point) => sum + point[0], 0) / continent.path.length;
      const centerY = continent.path.reduce((sum, point) => sum + point[1], 0) / continent.path.length;
      
      ctx.fillStyle = '#555555';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(continent.name, centerX, centerY);
    });
    
    // Draw resources
    RESOURCES.forEach(resource => {
      const resourceColors: Record<string, string> = {
        gold: '#FFD700',
        iron: '#A19D94',
        food: '#7CFC00',
        wood: '#8B4513'
      };
      
      // Draw resource circle
      ctx.fillStyle = resourceColors[resource.type] || '#AAAAAA';
      ctx.beginPath();
      ctx.arc(resource.x, resource.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw resource label
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(resource.type, resource.x, resource.y - 8);
    });
    
    // Draw the player's nation
    const nationId = getNationId(nationName);
    const countryData = COUNTRIES[nationId as keyof typeof COUNTRIES] || COUNTRIES.custom;
    
    ctx.fillStyle = countryData.color;
    ctx.fillRect(
      countryData.x, 
      countryData.y, 
      countryData.width, 
      countryData.height
    );
    
    // Draw influence radius
    const influenceRadius = calculateInfluence();
    ctx.strokeStyle = countryData.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      countryData.x + countryData.width / 2,
      countryData.y + countryData.height / 2,
      influenceRadius,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    
    // Draw units
    units.forEach(unit => {
      const unitType = UNIT_TYPES[unit.type];
      ctx.fillStyle = unitType.color;
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unitType.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Add nation name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      nationName,
      countryData.x + countryData.width / 2,
      countryData.y + countryData.height + 20
    );
    
    // Restore context
    ctx.restore();
    
    // Draw fixed UI elements (outside the transformed context)
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Year: ${year} - ${currentEra}`, 10, 20);
    
    // Draw controls info
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(canvas.width - 180, 10, 170, 70);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText('Controls:', canvas.width - 170, 30);
    ctx.fillText('• Drag to move map', canvas.width - 170, 50);
    ctx.fillText('• Mouse wheel to zoom', canvas.width - 170, 70);

    setCanvasLoaded(true);
  }, [nationName, resources, year, currentEra, mapOffset, zoom, units]);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-3">World Map</h2>
      <div className="w-full h-[500px] border border-gray-300 rounded overflow-hidden bg-blue-100 flex justify-center items-center">
        <canvas 
          ref={mapRef} 
          className={`${canvasLoaded ? 'block' : 'hidden'} cursor-move`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
        {!canvasLoaded && (
          <div className="text-gray-500">
            Loading map...
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-between">
        <p className="text-sm text-gray-600">The colored area represents your nation. Units will appear based on technologies.</p>
        <div className="flex space-x-2">
          <button 
            className="px-2 py-1 bg-gray-200 rounded text-sm"
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          >
            Zoom +
          </button>
          <button 
            className="px-2 py-1 bg-gray-200 rounded text-sm"
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          >
            Zoom -
          </button>
          <button 
            className="px-2 py-1 bg-gray-200 rounded text-sm"
            onClick={() => {
              setMapOffset({ x: 0, y: 0 });
              setZoom(1);
            }}
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  );
} 