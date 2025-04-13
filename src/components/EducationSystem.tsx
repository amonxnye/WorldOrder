import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useEducation } from '../utils/useEducation';

export default function EducationSystem() {
  const { population, investInResource, distributePeople } = useGameStore();
  const [investmentAmount, setInvestmentAmount] = useState(1);
  const { 
    educationLevel, 
    currentTier, 
    productivityBonus, 
    researchBonus 
  } = useEducation();
  
  // Handle investment in education
  const handleEducationInvestment = () => {
    // Education investments go into culture resource
    // Do multiple investments based on amount selected
    for (let i = 0; i < investmentAmount; i++) {
      investInResource('culture');
    }
  };
  
  return (
    <div className="game-card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold neon-text">Education System</h3>
        <div className="text-sm bg-gray-800 px-2 py-1 rounded">
          Level: <span className="font-bold">{educationLevel}/100</span>
        </div>
      </div>
      
      {/* Education Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Education Quality:</span>
          <span className="font-medium">{currentTier.name}</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-bar-inner ${currentTier.color}`} 
            style={{ width: `${educationLevel}%` }}
          ></div>
        </div>
      </div>
      
      {/* Current Benefits */}
      <div className="mb-5 p-3 glass-container">
        <h4 className="text-sm font-medium mb-2">Current Benefits:</h4>
        <ul className="text-sm space-y-1">
          <li>• {currentTier.benefits}</li>
          <li>• +{productivityBonus.toFixed(1)}% worker productivity</li>
          <li>• +{researchBonus}% research efficiency</li>
          <li>• {educationLevel >= 50 ? "Reduced population unrest" : "Basic skill development"}</li>
        </ul>
      </div>
      
      {/* Investment Controls */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Invest in Education:</span>
          <select 
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(Number(e.target.value))}
          >
            <option value="1">Small Investment</option>
            <option value="3">Medium Investment</option>
            <option value="5">Large Investment</option>
          </select>
        </div>
        
        <button 
          onClick={handleEducationInvestment}
          className="game-btn w-full mb-3"
        >
          Invest in Education System
        </button>
        
        <p className="text-xs text-gray-400 mb-4">Investing improves your culture resource, which enhances education.</p>
      </div>
      
      {/* Scientists Allocation */}
      <div className="p-3 bg-blue-900/40 backdrop-blur-sm rounded-lg">
        <div className="flex justify-between mb-2">
          <div>
            <span className="text-xl mr-2">🔬</span>
            <span className="font-medium">Scientists: {population.scientists}</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => distributePeople('scientists', -1)}
              disabled={population.scientists < 1}
              className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:bg-red-900"
            >
              -
            </button>
            <button
              onClick={() => distributePeople('scientists', 1)}
              disabled={population.men + population.women - population.workers - population.soldiers - population.scientists < 1}
              className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:bg-green-900"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-300">Scientists improve education and research speed</p>
      </div>
      
      {/* Education Facts */}
      <div className="mt-4 text-xs text-gray-400">
        <p>Education improves all aspects of your nation, from economic productivity to cultural development.</p>
      </div>
    </div>
  );
} 