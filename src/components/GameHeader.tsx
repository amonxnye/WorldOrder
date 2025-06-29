import React, { useState } from 'react';
import NationSelector from './NationSelector';
import UserProfile from './auth/UserProfile';
import TurnManager from './TurnManager';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../utils/AuthContext';

interface GameHeaderProps {
  onShowDiplomacy: () => void;
  onShowMultiplayer: () => void;
  onSignIn: () => void;
  gameStarted: boolean;
  showDiplomacy: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  onShowDiplomacy,
  onShowMultiplayer,
  onSignIn,
  gameStarted,
  showDiplomacy
}) => {
  const { currentUser } = useAuth();
  const { gameId, year, month, currentEra } = useGameStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Game Info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white neon-text">🌍 World Order</h1>
              {gameStarted && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-400">
                  <span className="px-2 py-1 bg-gray-800 rounded">
                    {month}/{year}
                  </span>
                  <span className="px-2 py-1 bg-gray-800 rounded">
                    {currentEra}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Center: Turn Manager (Multiplayer) */}
          {gameStarted && gameId && (
            <div className="hidden lg:block">
              <TurnManager />
            </div>
          )}

          {/* Right: Navigation and User */}
          <div className="flex items-center space-x-4">
            {gameStarted && (
              <>
                <NationSelector />
                
                {/* Game Actions */}
                <div className="hidden md:flex items-center space-x-2">
                  {gameId && (
                    <button
                      onClick={onShowDiplomacy}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        showDiplomacy
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white'
                      }`}
                    >
                      🤝 Diplomacy
                    </button>
                  )}
                  
                  <button
                    onClick={onShowMultiplayer}
                    className="px-4 py-2 bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white rounded-md text-sm font-medium transition-colors"
                  >
                    🎮 Multiplayer
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </>
            )}

            {/* User Profile or Sign In */}
            {currentUser ? (
              <UserProfile />
            ) : (
              <button 
                onClick={onSignIn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Turn Manager */}
        {gameStarted && gameId && (
          <div className="lg:hidden mt-4">
            <TurnManager />
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && gameStarted && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
            <div className="flex flex-col space-y-2">
              {gameId && (
                <button
                  onClick={() => {
                    onShowDiplomacy();
                    setIsMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                    showDiplomacy
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  🤝 Diplomacy
                </button>
              )}
              
              <button
                onClick={() => {
                  onShowMultiplayer();
                  setIsMenuOpen(false);
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md text-sm font-medium transition-colors text-left"
              >
                🎮 Multiplayer
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default GameHeader;