import TechTree from './components/TechTree';
import ResourceDisplay from './components/ResourceDisplay';
import NaturalResourceDisplay from './components/NaturalResourceDisplay';
import PopulationManager from './components/PopulationManager';
import YearlyObjectives from './components/YearlyObjectives';
import NationSelector from './components/NationSelector';
import ThreeJsBackground from './components/ThreeJsBackground';
import BabylonGlobe from './components/BabylonGlobe';
import EducationSystem from './components/EducationSystem';
import BankingSystem from './components/BankingSystem';
import AuthContainer from './components/auth/AuthContainer';
import UserProfile from './components/auth/UserProfile';
import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useAuth } from './utils/AuthContext';
import { updateUserGameStats } from './utils/firebase';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const resetGame = useGameStore(state => state.resetGame);
  const { currentUser, loading } = useAuth();
  const gameState = useGameStore(state => state);
  
  // Initialize game with objectives on first load
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Save game stats when game state changes
  useEffect(() => {
    if (currentUser && gameStarted) {
      const saveInterval = setInterval(() => {
        const gameStats = {
          lastPlayed: new Date(),
          gamesCompleted: gameState.year > 2000 ? 1 : 0, // Example condition for game completion
          highestScore: Math.floor(
            gameState.resources.money + 
            gameState.resources.food + 
            gameState.population.total * 100
          ), // Example score calculation
        };
        
        updateUserGameStats(currentUser.uid, gameStats);
      }, 60000); // Save every minute
      
      return () => clearInterval(saveInterval);
    }
  }, [currentUser, gameStarted, gameState]);

  const toggleAuthModal = () => {
    setAuthModalOpen(!authModalOpen);
  };

  const handleStartGame = () => {
    if (currentUser) {
      setGameStarted(true);
    } else {
      toggleAuthModal();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThreeJsBackground />
      
      <main className="min-h-screen p-4 md:p-8 relative z-10">
        <header className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white neon-text">🌍 World Order</h1>
          <div className="flex items-center gap-4">
            {gameStarted && <NationSelector />}
            {currentUser ? (
              <UserProfile />
            ) : (
              <button 
                onClick={toggleAuthModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </header>
        
        {!gameStarted ? (
          <div className="max-w-3xl mx-auto p-8 glass-container hover-scale">
            <h2 className="text-3xl font-bold mb-6 text-center neon-text">Welcome to World Order</h2>
            <p className="mb-8 text-lg text-center">
              Lead your nation from 1925 to the present day. Navigate through historical eras, 
              research technologies, build your economy, and establish diplomatic relations.
              Will you become a global superpower?
            </p>
            
            <div className="glass-container mb-8 p-6 pulse-glow">
              <h3 className="font-semibold mb-4 text-xl text-center">Game Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start p-3">
                  <div className="text-2xl mr-3 text-blue-400">🏙️</div>
                  <div>
                    <h4 className="font-medium mb-1">Nation Building</h4>
                    <p className="text-sm text-gray-300">Start with a small village and grow into a global power</p>
                  </div>
                </div>
                <div className="flex items-start p-3">
                  <div className="text-2xl mr-3 text-green-400">🌱</div>
                  <div>
                    <h4 className="font-medium mb-1">Resource Management</h4>
                    <p className="text-sm text-gray-300">Balance your resources and meet yearly objectives</p>
                  </div>
                </div>
                <div className="flex items-start p-3">
                  <div className="text-2xl mr-3 text-purple-400">🔬</div>
                  <div>
                    <h4 className="font-medium mb-1">Research & Development</h4>
                    <p className="text-sm text-gray-300">Unlock powerful technologies to advance your civilization</p>
                  </div>
                </div>
                <div className="flex items-start p-3">
                  <div className="text-2xl mr-3 text-amber-400">👥</div>
                  <div>
                    <h4 className="font-medium mb-1">Population Control</h4>
                    <p className="text-sm text-gray-300">Manage your citizens across different roles</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleStartGame}
              className="game-btn w-full py-4 text-lg font-bold"
            >
              {currentUser ? "Embark on Your Journey" : "Sign in to Play"}
            </button>

            {!currentUser && (
              <div className="mt-4 text-center text-gray-300">
                <p className="mb-2">Sign in required to play the game and save your progress.</p>
                <button 
                  onClick={toggleAuthModal}
                  className="text-blue-400 hover:text-blue-300 underline focus:outline-none"
                >
                  Sign in or create an account
                </button> 
                {' '}to track your achievements and compete on leaderboards!
              </div>
            )}
          </div>
        ) : (
          currentUser ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
              {/* Left Column: Resource Management */}
              <div className="md:col-span-3 space-y-6">
                <ResourceDisplay />
                <NaturalResourceDisplay />
                <PopulationManager />
                <BankingSystem />
              </div>
              
              {/* Middle Column: Tech Tree */}
              <div className="md:col-span-6">
                <div className="game-card h-full p-4">
                  <h3 className="text-xl font-semibold text-white mb-4 neon-text">Technology Tree</h3>
                  <div className="h-[calc(100%-2rem)] overflow-auto">
                    <TechTree />
                  </div>
                </div>
              </div>
              
              {/* Right Column: Objectives and Map */}
              <div className="md:col-span-3 space-y-6">
                <YearlyObjectives />
                <EducationSystem />
                <div className="game-card p-4 h-80">
                  <h3 className="text-xl font-semibold text-white mb-3 neon-text">World Map</h3>
                  <div className="h-[calc(100%-2rem)]">
                    <BabylonGlobe />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-8 glass-container hover-scale text-center">
              <h2 className="text-2xl font-bold mb-4 text-red-500">Authentication Required</h2>
              <p className="mb-6">You must be signed in to play World Order.</p>
              <button 
                onClick={toggleAuthModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Sign In to Continue
              </button>
              <button 
                onClick={() => setGameStarted(false)}
                className="block mx-auto mt-4 text-gray-400 hover:text-white underline"
              >
                Return to Home
              </button>
            </div>
          )
        )}
        
        <footer className="mt-12 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>World Order - A Historical Nation Building Simulator</p>
          <p className="mt-1 text-xs text-gray-500">Powered by Three.js & Babylon.js</p>
        </footer>
      </main>

      <AuthContainer isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

export default App
