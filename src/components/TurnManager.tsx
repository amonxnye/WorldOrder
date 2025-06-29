import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../utils/AuthContext';
import useMultiplayerSync from '../hooks/useMultiplayerSync';

const TurnManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    multiplayer, 
    endTurn,
    gameId 
  } = useGameStore();
  
  const { 
    isMultiplayer, 
    isHost, 
    currentPlayer, 
    players 
  } = useMultiplayerSync();

  if (!isMultiplayer || !gameId) {
    return null;
  }

  const isCurrentPlayerTurn = currentPlayer === currentUser?.uid;
  const currentPlayerInfo = players[currentPlayer];
  const turnTimeRemaining = multiplayer.turnInfo.deadline ? 
    Math.max(0, multiplayer.turnInfo.deadline - Date.now()) : null;

  const handleEndTurn = () => {
    if (isCurrentPlayerTurn) {
      endTurn();
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-card p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isCurrentPlayerTurn ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-white font-medium">
              {isCurrentPlayerTurn ? 'Your Turn' : `${currentPlayerInfo?.nationName || 'Unknown'}'s Turn`}
            </span>
          </div>
          
          <div className="text-sm text-gray-400">
            Turn {multiplayer.turnInfo.turnNumber}
          </div>
          
          {turnTimeRemaining && (
            <div className="text-sm text-yellow-400">
              Time: {formatTimeRemaining(turnTimeRemaining)}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {multiplayer.turnInfo.actionsTaken.length > 0 && (
            <div className="text-sm text-gray-400">
              Actions: {multiplayer.turnInfo.actionsTaken.length}
            </div>
          )}
          
          {isCurrentPlayerTurn && (
            <button
              onClick={handleEndTurn}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-md transition-colors"
            >
              End Turn
            </button>
          )}
        </div>
      </div>

      {/* Player status indicators */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.values(players).map(player => (
          <div
            key={player.userId}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
              player.userId === currentPlayer
                ? 'bg-green-600/20 text-green-300 border border-green-600/30'
                : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              player.isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`} />
            <span>{player.nationName}</span>
          </div>
        ))}
      </div>

      {/* Turn actions summary */}
      {multiplayer.turnInfo.actionsTaken.length > 0 && (
        <div className="mt-3 text-xs text-gray-400">
          <div className="font-medium mb-1">Actions this turn:</div>
          <div className="space-y-1">
            {multiplayer.turnInfo.actionsTaken.map((action, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-gray-500 rounded-full" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnManager;