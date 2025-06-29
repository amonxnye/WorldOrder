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
import GameTabs from './components/GameTabs';
import GameHeader from './components/GameHeader';
import MultiplayerEventsFeed from './components/MultiplayerEventsFeed';
import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useAuth } from './utils/AuthContext';
import { updateUserGameStats, getGameDataFromFirestore } from './utils/firebase';
import { userTracker } from './utils/userTracking';

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

  // Initialize user tracking when user logs in
  useEffect(() => {
    if (currentUser) {
      userTracker.startTracking(currentUser);
      userTracker.trackPageView('game_main');
    } else {
      userTracker.stopTracking();
    }

    return () => {
      userTracker.stopTracking();
    };
  }, [currentUser]);

  // Track game state changes
  useEffect(() => {
    if (currentUser && gameStarted) {
      userTracker.trackGameStateUpdate(gameState);
    }
  }, [gameState.year, gameState.resources, gameState.population, currentUser, gameStarted]);


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
    userTracker.trackActivity('start_game_clicked');
    
    if (currentUser) {
      if (nationName && leaderName) {
        setGameStarted(true);
        userTracker.trackActivity('game_started', { nationName, leaderName });
      } else {
        setNationSetupModalOpen(true);
        userTracker.trackActivity('nation_setup_opened');
      }
    } else {
      toggleAuthModal();
      userTracker.trackActivity('auth_modal_opened', { source: 'start_game' });
    }
  };

  const handleShowDiplomacy = () => {
    setShowDiplomacy(!showDiplomacy);
    userTracker.trackActivity('diplomacy_toggled', { showing: !showDiplomacy });
  };

  const handleShowMultiplayer = () => {
    setMultiplayerLobbyOpen(true);
    userTracker.trackActivity('multiplayer_lobby_opened');
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
      
      <div className="min-h-screen relative z-10 flex flex-col">
        <GameHeader
          onShowDiplomacy={handleShowDiplomacy}
          onShowMultiplayer={handleShowMultiplayer}
          onSignIn={toggleAuthModal}
          gameStarted={gameStarted}
          showDiplomacy={showDiplomacy}
        />

        <main className="flex-1 flex flex-col">{/* Main content will go here */}
        
        {!gameStarted && !multiplayerLobbyOpen && !showDiplomacy ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-4xl w-full">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 neon-text">Welcome to World Order</h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Lead your nation from 1925 to the present day. Build economies, research technologies, 
                  and establish diplomatic relations in this immersive strategy experience.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid gap-4 max-w-md mx-auto mb-12">
                <button 
                  onClick={handleStartGame}
                  className="game-btn py-4 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {currentUser ? (nationName && leaderName ? "🚀 Continue Your Journey" : "🏗️ Setup Your Nation") : "🔑 Sign in to Play"}
                </button>
                <button 
                  onClick={() => setMultiplayerLobbyOpen(true)}
                  className="game-btn py-4 text-lg font-bold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  🎮 Multiplayer
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="glass-container p-6 text-center hover-scale">
                  <div className="text-3xl mb-3">🏛️</div>
                  <h3 className="font-semibold mb-2 text-white">Nation Building</h3>
                  <p className="text-sm text-gray-400">Grow from a small settlement to a global superpower</p>
                </div>
                <div className="glass-container p-6 text-center hover-scale">
                  <div className="text-3xl mb-3">🔬</div>
                  <h3 className="font-semibold mb-2 text-white">Research & Tech</h3>
                  <p className="text-sm text-gray-400">Unlock powerful technologies across multiple eras</p>
                </div>
                <div className="glass-container p-6 text-center hover-scale">
                  <div className="text-3xl mb-3">🤝</div>
                  <h3 className="font-semibold mb-2 text-white">Diplomacy</h3>
                  <p className="text-sm text-gray-400">Form alliances, trade agreements, or declare wars</p>
                </div>
                <div className="glass-container p-6 text-center hover-scale">
                  <div className="text-3xl mb-3">🌍</div>
                  <h3 className="font-semibold mb-2 text-white">Multiplayer</h3>
                  <p className="text-sm text-gray-400">Compete with other players in real-time strategy</p>
                </div>
              </div>

              {/* Community Link */}
              <div className="text-center">
                <a 
                  href="https://discord.gg/vfUcnv8y" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600/20 border border-indigo-500 rounded-lg text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 71 55" fill="currentColor">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                  </svg>
                  <span>Join our Discord community</span>
                </a>
              </div>

              {!currentUser && (
                <div className="mt-8 text-center">
                  <p className="text-gray-400 mb-4">Sign in to save your progress and compete on leaderboards</p>
                  <button 
                    onClick={toggleAuthModal}
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Create account or sign in →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : multiplayerLobbyOpen ? (
          <div className="flex-1 p-6">
            <MultiplayerLobby />
          </div>
        ) : showDiplomacy ? (
          <div className="flex-1 p-6">
            <DiplomacyDashboard />
          </div>
        ) : (
          currentUser ? (
            <div className="flex-1 p-6 relative">
              {/* Multiplayer Events Feed */}
              <MultiplayerEventsFeed />
              
              {/* Main Game Interface */}
              <GameTabs />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md text-center glass-container p-8">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold mb-4 text-red-400">Authentication Required</h2>
                <p className="mb-6 text-gray-400">You must be signed in to play World Order.</p>
                <button 
                  onClick={toggleAuthModal}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors mb-4"
                >
                  Sign In to Continue
                </button>
                <button 
                  onClick={() => setGameStarted(false)}
                  className="text-gray-400 hover:text-white underline text-sm"
                >
                  Return to Home
                </button>
              </div>
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
      </div>

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
