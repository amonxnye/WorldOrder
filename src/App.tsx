import DiplomacyDashboard from './components/DiplomacyDashboard';
import MultiplayerLobby from './components/MultiplayerLobby';
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
import NationSetupModal from './components/NationSetupModal';
import TurnManager from './components/TurnManager';
import MultiplayerEventsFeed from './components/MultiplayerEventsFeed';
import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useAuth } from './utils/AuthContext';
import { updateUserGameStats, getGameDataFromFirestore } from './utils/firebase';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [nationSetupModalOpen, setNationSetupModalOpen] = useState(false);
  const [multiplayerLobbyOpen, setMultiplayerLobbyOpen] = useState(false);
  const [isMultiplayerGameLoaded, setIsMultiplayerGameLoaded] = useState(false);
  const [showDiplomacy, setShowDiplomacy] = useState(false); // New state for diplomacy dashboard

  const resetGame = useGameStore(state => state.resetGame);
  const setGameState = useGameStore(state => state.setGameState);
  const { currentUser, loading } = useAuth();
  const gameState = useGameStore(state => state);
  const nationName = useGameStore(state => state.nationName);
  const leaderName = useGameStore(state => state.leaderName);
  const gameId = useGameStore(state => state.gameId);
  
  // Initialize game with objectives on first load
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Load multiplayer game data if gameId is set
  useEffect(() => {
    const loadMultiplayerGame = async () => {
      if (gameId && currentUser) {
        setIsMultiplayerGameLoaded(false);
        try {
          const gameData = await getGameDataFromFirestore(gameId);
          if (gameData && gameData.playerData && gameData.playerData[currentUser.uid]) {
            setGameState(gameData.playerData[currentUser.uid]);
            setGameStarted(true);
            setMultiplayerLobbyOpen(false);
          } else {
            console.error("Player data not found in game document.");
            // Handle error: maybe redirect back to lobby or show message
          }
        } catch (error) {
          console.error("Error loading multiplayer game:", error);
          // Handle error
        } finally {
          setIsMultiplayerGameLoaded(true);
        }
      }
    };

    loadMultiplayerGame();
  }, [gameId, currentUser, setGameState]);

  // Save game stats when game state changes
  useEffect(() => {
    if (currentUser && gameStarted) {
      const saveInterval = setInterval(() => {
        // Calculate a score based on available properties
        const score = Math.floor(
          // Use any numeric resources available in the state
          (gameState.resources.stability || 0) + 
          (gameState.resources.economy || 0) + 
          (gameState.naturalResources.food || 0) +
          // Sum all population types
          ((gameState.population.men || 0) + 
           (gameState.population.women || 0) + 
           (gameState.population.workers || 0)) * 10
        );
        
        const gameStats = {
          lastPlayed: new Date(),
          gamesCompleted: gameState.year > 2000 ? 1 : 0, // Example condition for game completion
          highestScore: score
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
      if (nationName && leaderName) {
        setGameStarted(true);
      } else {
        setNationSetupModalOpen(true);
      }
    } else {
      toggleAuthModal();
    }
  };

  if (loading || (gameId && !isMultiplayerGameLoaded)) {
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
            {gameStarted && gameId && (
              <button
                onClick={() => setShowDiplomacy(!showDiplomacy)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Diplomacy
              </button>
            )}
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
        
        {!gameStarted && !multiplayerLobbyOpen && !showDiplomacy ? ( // Added showDiplomacy to condition
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
            
            <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-700 rounded-lg text-center">
              <a 
                href="https://discord.gg/vfUcnv8y" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-blue-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 71 55" fill="currentColor">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                </svg>
                Join our Discord community to give feedback and get updates!
              </a>
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleStartGame}
                className="game-btn w-full py-4 text-lg font-bold"
              >
                {currentUser ? (nationName && leaderName ? "Continue Your Journey" : "Setup Your Nation") : "Sign in to Play"}
              </button>
              <button 
                onClick={() => setMultiplayerLobbyOpen(true)}
                className="game-btn w-full py-4 text-lg font-bold"
              >
                Multiplayer
              </button>
            </div>

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
        ) : multiplayerLobbyOpen ? (
          <MultiplayerLobby />
        ) : showDiplomacy ? (
          <DiplomacyDashboard />
        ) : (
          currentUser ? (
            <>
              {/* Multiplayer Components */}
              <TurnManager />
              <MultiplayerEventsFeed />
              
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
            </>
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
          <p className="mt-2">
            <a 
              href="https://discord.gg/vfUcnv8y" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 71 55" fill="currentColor">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
              </svg>
              Join our Discord community
            </a>
          </p>
        </footer>
      </main>

      <AuthContainer isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <NationSetupModal 
        isOpen={nationSetupModalOpen} 
        onClose={() => {
          setNationSetupModalOpen(false);
          // If nation and leader are selected, start the game
          if (nationName && leaderName) {
            setGameStarted(true);
          }
        }} 
      />
    </>
  );
}

export default App;
