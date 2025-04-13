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
  
  // Resource style mapping
  const resourceStyles = {
    stability: {
      gradient: "from-blue-600/40 to-blue-900/40",
      border: "border-blue-500/50",
      button: "game-btn",
      icon: "text-blue-400",
      progressColor: "bg-blue-500"
    },
    economy: {
      gradient: "from-emerald-600/40 to-emerald-900/40",
      border: "border-emerald-500/50",
      button: "game-btn",
      icon: "text-emerald-400",
      progressColor: "bg-emerald-500"
    },
    military: {
      gradient: "from-red-600/40 to-red-900/40",
      border: "border-red-500/50",
      button: "game-btn",
      icon: "text-red-400",
      progressColor: "bg-red-500"
    },
    diplomacy: {
      gradient: "from-violet-600/40 to-violet-900/40",
      border: "border-violet-500/50",
      button: "game-btn",
      icon: "text-violet-400",
      progressColor: "bg-violet-500"
    },
    culture: {
      gradient: "from-amber-600/40 to-amber-900/40",
      border: "border-amber-500/50",
      button: "game-btn",
      icon: "text-amber-400",
      progressColor: "bg-amber-500"
    }
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
  
  return (
    <div className="game-card p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold neon-text">{nationName}</h2>
        <div className="flex justify-between items-center">
          <p className="text-gray-400">Leader: {leaderName}</p>
          <div className="text-sm px-2 py-1 bg-blue-900/30 rounded-full text-blue-300 border border-blue-500/30">
            Era 1925-1950
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-4 neon-text">Nation Resources</h3>
      
      <div className="space-y-5">
        {Object.entries(resources).map(([key, value]) => {
          const resourceKey = key as keyof typeof resources;
          const style = resourceStyles[resourceKey];
          
          // Calculate resource level category
          let levelText;
          let levelClass;
          if (value >= 80) {
            levelText = "Excellent";
            levelClass = "text-green-400";
          } else if (value >= 60) {
            levelText = "Strong";
            levelClass = "text-green-400";
          } else if (value >= 40) {
            levelText = "Average";
            levelClass = "text-blue-400";
          } else if (value >= 20) {
            levelText = "Weak";
            levelClass = "text-amber-400";
          } else {
            levelText = "Critical";
            levelClass = "text-red-400";
          }
          
          return (
            <div 
              key={key}
              className={`relative overflow-hidden transition-all duration-300 hover-scale p-4 bg-gradient-to-r ${style.gradient} border ${style.border}`}
              style={{ borderRadius: '0.75rem' }}
            >
              <div className="relative">
                {resourceAnimations
                  .filter(anim => anim.key === key)
                  .map((anim, i) => {
                    const age = Date.now() - anim.timestamp;
                    const opacity = Math.max(0, 1 - age / 2000);
                    const translateY = -30 * (age / 2000);
                    
                    return (
                      <div 
                        key={`${anim.timestamp}-${i}`}
                        className="absolute top-0 right-4 font-bold text-lg transition-all"
                        style={{ 
                          transform: `translateY(${translateY}px)`,
                          opacity,
                          color: anim.amount > 0 ? '#4ade80' : '#f87171'
                        }}
                      >
                        {anim.amount > 0 ? '+' : ''}{anim.amount.toFixed(1)}
                      </div>
                    );
                  })
                }
              
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <span className={`text-2xl mr-3 ${style.icon}`}>{resourceIcons[resourceKey]}</span>
                    <div>
                      <h4 className="font-medium capitalize text-white">{key}</h4>
                      <span className={`text-xs font-medium ${levelClass}`}>{levelText}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{Math.floor(value)}</span>
                    <span className="text-gray-400 text-sm">/100</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="progress-bar mb-3">
                  <div 
                    className={`progress-bar-inner ${style.progressColor}`}
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">
                    {key === "stability" && "Internal unity and governance"}
                    {key === "economy" && "Production and wealth"}
                    {key === "military" && "Defense capabilities"}
                    {key === "diplomacy" && "Foreign relations"}
                    {key === "culture" && "Arts and innovation"}
                  </div>
                  
                  <button
                    onClick={() => investInResource(resourceKey)}
                    className={`${style.button} py-1 px-3 text-sm rounded-md inline-flex items-center space-x-1`}
                  >
                    <span>Invest</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {lastTechResearched && (
        <div className="mt-4 p-3 bg-blue-900/50 rounded border border-blue-700 animate-pulse">
          <div className="flex items-center">
            <div className="text-xl text-blue-400 mr-2">🔬</div>
            <div>
              <h4 className="font-medium text-blue-300">Research Completed!</h4>
              <p className="text-sm text-blue-200">{lastTechResearched}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex flex-wrap gap-2 text-center">
          <div className="px-2 py-1 bg-blue-900/20 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex-1">
            <div className="font-medium">Resources</div>
            <div className="text-sm">5</div>
          </div>
          <div className="px-2 py-1 bg-emerald-900/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex-1">
            <div className="font-medium">Technologies</div>
            <div className="text-sm">0</div>
          </div>
          <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex-1">
            <div className="font-medium">Population</div>
            <div className="text-sm">10</div>
          </div>
        </div>
      </div>
    </div>
  );
} 