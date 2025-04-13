import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

type ResourceAnimation = {
  key: string;
  amount: number;
  timestamp: number;
};

export default function ResourceDisplay() {
  const { resources, nationName, leaderName, lastTechResearched, investInResource } = useGameStore();
  const [prevResources, setPrevResources] = useState(resources);
  const [resourceAnimations, setResourceAnimations] = useState<ResourceAnimation[]>([]);
  
  // Resource icon mapping
  const resourceIcons = {
    stability: "🛡️",
    economy: "💰",
    military: "⚔️",
    diplomacy: "🤝",
    culture: "🎭"
  };
  
  // Track resource changes and create animations
  useEffect(() => {
    // Compare current resources with previous
    const changes: ResourceAnimation[] = [];
    
    Object.entries(resources).forEach(([key, value]) => {
      const prevValue = prevResources[key as keyof typeof resources];
      if (value !== prevValue) {
        const change = value - prevValue;
        if (change !== 0) {
          changes.push({
            key,
            amount: change,
            timestamp: Date.now()
          });
        }
      }
    });
    
    if (changes.length > 0) {
      // Add new animations
      setResourceAnimations(prev => [...prev, ...changes]);
      
      // Update previous resources
      setPrevResources(resources);
    }
  }, [resources]);
  
  // Clean up old animations
  useEffect(() => {
    if (resourceAnimations.length > 0) {
      const now = Date.now();
      const ANIMATION_DURATION = 2000; // 2 seconds
      
      // Remove animations older than 2 seconds
      setResourceAnimations(prev => 
        prev.filter(anim => now - anim.timestamp < ANIMATION_DURATION)
      );
    }
    
    // Set up interval to clean animations
    const interval = setInterval(() => {
      const now = Date.now();
      const ANIMATION_DURATION = 2000;
      
      setResourceAnimations(prev => 
        prev.filter(anim => now - anim.timestamp < ANIMATION_DURATION)
      );
    }, 1000);
    
    return () => clearInterval(interval);
  }, [resourceAnimations]);
  
  // Handle clicking on a resource to invest
  const handleResourceInvest = (resourceKey: keyof typeof resources) => {
    investInResource(resourceKey);
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{nationName}</h2>
        <p className="text-gray-600">Leader: {leaderName}</p>
      </div>
      
      <h3 className="text-lg font-semibold mb-2">National Resources</h3>
      <p className="text-xs text-gray-500 mb-3">Click on a resource to invest natural resources and grow it</p>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(resources).map(([key, value]) => (
          <div 
            key={key} 
            className="flex items-center p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handleResourceInvest(key as keyof typeof resources)}
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full mr-2 relative">
              <span className="text-xl">{resourceIcons[key as keyof typeof resourceIcons]}</span>
              
              {/* Show animations for this resource */}
              {resourceAnimations
                .filter(anim => anim.key === key)
                .map((anim, i) => {
                  const age = Date.now() - anim.timestamp;
                  const opacity = Math.max(0, 1 - age / 2000);
                  const translateY = -20 * (age / 2000);
                  
                  return (
                    <div 
                      key={`${anim.timestamp}-${i}`}
                      className={`absolute top-0 left-0 w-full text-center font-bold transition-all`}
                      style={{ 
                        transform: `translateY(${translateY}px)`,
                        opacity,
                        color: anim.amount > 0 ? 'green' : 'red'
                      }}
                    >
                      {anim.amount > 0 ? '+' : ''}{anim.amount.toFixed(1)}
                    </div>
                  );
                })
              }
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium capitalize">{key}</p>
                <p className="text-sm font-semibold">{Math.round(value)}/100</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div 
                  className={`h-2 rounded-full ${getColorForValue(value)} transition-all duration-1000`} 
                  style={{ width: `${Math.min(100, value)}%` }}
                ></div>
              </div>
              
              {/* Invest button */}
              <button 
                className="w-full mt-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResourceInvest(key as keyof typeof resources);
                }}
              >
                Invest
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {lastTechResearched && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200 animate-pulse">
          <h4 className="font-medium">Research Completed!</h4>
          <p className="text-sm">{lastTechResearched}</p>
        </div>
      )}
    </div>
  );
}

// Helper function to determine color based on value
function getColorForValue(value: number): string {
  if (value < 25) return 'bg-red-500';
  if (value < 50) return 'bg-amber-500';
  if (value < 75) return 'bg-blue-500';
  return 'bg-green-500';
} 