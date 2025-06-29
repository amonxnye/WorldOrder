
import React, { useState, useEffect } from 'react';
import { createGameInFirestore, getGamesFromFirestore, joinGameInFirestore } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';
import { useGameStore } from '../store/gameStore';

interface GameLobbyProps {
  id: string;
  gameName: string;
  hostId: string;
  playerIds: string[];
  status: string;
}

const MultiplayerLobby = () => {
  const { currentUser } = useAuth();
  const { nationName, leaderName, setGameId } = useGameStore();
  const [gameName, setGameName] = useState('');
  const [availableGames, setAvailableGames] = useState<GameLobbyProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    setError('');
    try {
      const games = await getGamesFromFirestore();
      setAvailableGames(games);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch games.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (!currentUser || !nationName || !leaderName) {
      setError('You must be signed in and have your nation set up to create a game.');
      return;
    }
    if (!gameName.trim()) {
      setError('Please enter a game name.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const newGameId = await createGameInFirestore(gameName, currentUser.uid, nationName, leaderName);
      setGameId(newGameId);
      // Optionally, navigate to game or game lobby screen
      console.log('Game created:', newGameId);
    } catch (err: any) {
      setError(err.message || 'Failed to create game.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!currentUser || !nationName || !leaderName) {
      setError('You must be signed in and have your nation set up to join a game.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await joinGameInFirestore(gameId, currentUser.uid, nationName, leaderName);
      setGameId(gameId);
      // Optionally, navigate to game or game lobby screen
      console.log('Joined game:', gameId);
    } catch (err: any) {
      setError(err.message || 'Failed to join game.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 glass-container">
      <h2 className="text-3xl font-bold mb-6 text-center neon-text">Multiplayer Lobby</h2>
      {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-container p-6">
          <h3 className="text-2xl font-semibold mb-4">Create Game</h3>
          <input
            type="text"
            placeholder="Enter game name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-4"
            disabled={loading}
          />
          <button 
            onClick={handleCreateGame}
            className="game-btn w-full py-3"
            disabled={loading || !currentUser || !nationName || !leaderName}
          >
            {loading ? 'Creating...' : 'Create New Game'}
          </button>
          {!currentUser && <p className="text-sm text-gray-400 mt-2">Sign in to create a game.</p>}
          {currentUser && (!nationName || !leaderName) && <p className="text-sm text-gray-400 mt-2">Set up your nation to create a game.</p>}
        </div>
        <div className="glass-container p-6">
          <h3 className="text-2xl font-semibold mb-4">Join Game</h3>
          {loading ? (
            <p className="text-center text-gray-400">Loading games...</p>
          ) : availableGames.length === 0 ? (
            <p className="text-center text-gray-400">No games available to join.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableGames.map((game) => (
                <div key={game.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{game.gameName}</p>
                    <p className="text-sm text-gray-400">Players: {game.playerIds.length}</p>
                  </div>
                  <button 
                    onClick={() => handleJoinGame(game.id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded"
                    disabled={loading || !currentUser || !nationName || !leaderName}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
          {!currentUser && <p className="text-sm text-gray-400 mt-2">Sign in to join a game.</p>}
          {currentUser && (!nationName || !leaderName) && <p className="text-sm text-gray-400 mt-2">Set up your nation to join a game.</p>}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
