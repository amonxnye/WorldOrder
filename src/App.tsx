import TechTree from './components/TechTree';
import ResourceDisplay from './components/ResourceDisplay';
import NaturalResourceDisplay from './components/NaturalResourceDisplay';
import PopulationManager from './components/PopulationManager';
import YearlyObjectives from './components/YearlyObjectives';
import NationSelector from './components/NationSelector';
import WorldMap from './components/WorldMap';
import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const resetGame = useGameStore(state => state.resetGame);
  
  // Initialize game with objectives on first load
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="flex flex-wrap justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">🌍 World Order</h1>
        {gameStarted && <NationSelector />}
      </header>
      
      {!gameStarted ? (
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Welcome to World Order</h2>
          <p className="mb-6">
            Lead your nation from 1925 to the present day. Navigate through historical eras, 
            research technologies, build your economy, and establish diplomatic relations.
            Will you become a global superpower?
          </p>
          
          <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200">
            <h3 className="font-semibold mb-2">Game Features:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Start with a small village of 5 men and 5 women</li>
              <li>Manage natural resources and population to meet yearly objectives</li>
              <li>Invest in development areas by spending resources</li>
              <li>Research technologies to unlock new possibilities</li>
              <li>Complete all objectives to advance to the next year</li>
            </ul>
          </div>
          
          <button 
            onClick={() => setGameStarted(true)}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Game
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
          {/* Left Column: Resource Management */}
          <div className="md:col-span-3 space-y-4">
            <ResourceDisplay />
            <NaturalResourceDisplay />
            <PopulationManager />
          </div>
          
          {/* Middle Column: Tech Tree */}
          <div className="md:col-span-6">
            <TechTree />
          </div>
          
          {/* Right Column: Objectives and Map */}
          <div className="md:col-span-3 space-y-4">
            <YearlyObjectives />
            <WorldMap />
          </div>
        </div>
      )}
      
      <footer className="mt-12 pt-4 border-t text-center text-gray-500 text-sm">
        World Order - A Historical Nation Building Simulator
      </footer>
    </main>
  );
}

export default App
