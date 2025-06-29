import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../utils/AuthContext';
import { getGameDataFromFirestore, updateDiplomaticStanceInFirestore, respondToTradeOfferInFirestore, declareWarInFirestore, launchAttackInFirestore } from '../utils/firebase';
import TradeOfferModal from './TradeOfferModal';

interface PlayerData {
  nationName: string;
  leaderName: string;
  // Add other relevant player data here
}

interface GameData {
  playerIds: string[];
  playerData: Record<string, PlayerData>;
  diplomaticStances: Record<string, 'neutral' | 'alliance' | 'rivalry'>;
}

interface TradeOffer {
  id: string;
  fromUserId: string;
  toUserId: string;
  offeredResources: any;
  requestedResources: any;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

const DiplomacyDashboard = () => {
  const { currentUser } = useAuth();
  const { gameId, diplomaticStances, setDiplomaticStance } = useGameStore();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [tradeOfferModalOpen, setTradeOfferModalOpen] = useState(false);
  const [selectedPlayerForTrade, setSelectedPlayerForTrade] = useState<string | null>(null);
  const [incomingTradeOffers, setIncomingTradeOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId || !currentUser) return;

      setLoading(true);
      setError('');
      try {
        const data = await getGameDataFromFirestore(gameId);
        if (data) {
          setGameData(data as GameData);
          // Filter incoming trade offers for the current user
          const offers = data.trade_offers ? Object.values(data.trade_offers).filter(
            (offer: any) => offer.toUserId === currentUser.uid && offer.status === 'pending'
          ) : [];
          setIncomingTradeOffers(offers as TradeOffer[]);
        } else {
          setError('Game data not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch game data.');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, currentUser]);

  const handleSetStance = async (targetUserId: string, stance: 'neutral' | 'alliance' | 'rivalry') => {
    if (!gameId || !currentUser) return;

    try {
      await updateDiplomaticStanceInFirestore(gameId, currentUser.uid, targetUserId, stance);
      setDiplomaticStance(targetUserId, stance);
    } catch (err: any) {
      setError(err.message || 'Failed to update diplomatic stance.');
    }
  };

  const handleOpenTradeModal = (playerId: string) => {
    setSelectedPlayerForTrade(playerId);
    setTradeOfferModalOpen(true);
  };

  const handleRespondToTradeOffer = async (offerId: string, accepted: boolean) => {
    if (!gameId || !currentUser) return;

    try {
      await respondToTradeOfferInFirestore(gameId, offerId, currentUser.uid, accepted);
      // Refresh data after response
      fetchGameData();
    } catch (err: any) {
      setError(err.message || 'Failed to respond to trade offer.');
    }
  };

  const handleDeclareWar = async (targetUserId: string) => {
    if (!gameId || !currentUser) return;
    if (!window.confirm(`Are you sure you want to declare war on ${gameData?.playerData[targetUserId]?.nationName}?`)) return;

    setLoading(true);
    setError('');
    try {
      await declareWarInFirestore(gameId, currentUser.uid, targetUserId);
      setDiplomaticStance(targetUserId, 'rivalry'); // Update local state immediately
      fetchGameData(); // Re-fetch to get updated game data including active wars
    } catch (err: any) {
      setError(err.message || 'Failed to declare war.');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchAttack = async (targetUserId: string) => {
    if (!gameId || !currentUser) return;
    if (!window.confirm(`Are you sure you want to launch an attack on ${gameData?.playerData[targetUserId]?.nationName}? This will cost military resources.`)) return;

    setLoading(true);
    setError('');
    try {
      // For simplicity, attack strength is current military resource. Can be expanded.
      const attackStrength = useGameStore.getState().resources.military;
      const result = await launchAttackInFirestore(gameId, currentUser.uid, targetUserId, attackStrength);
      console.log("Attack result:", result);
      fetchGameData(); // Re-fetch to get updated game data including resource changes
    } catch (err: any) {
      setError(err.message || 'Failed to launch attack.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-white">Loading diplomacy...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  if (!gameData || !currentUser) {
    return <div className="text-center text-gray-400">Not in a multiplayer game.</div>;
  }

  const otherPlayers = gameData.playerIds.filter(id => id !== currentUser.uid);

  return (
    <div className="game-card p-4">
      <h3 className="text-xl font-semibold text-white mb-4 neon-text">Diplomacy</h3>
      
      {incomingTradeOffers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-3">Incoming Trade Offers:</h4>
          <div className="space-y-3">
            {incomingTradeOffers.map(offer => (
              <div key={offer.id} className="bg-gray-600/50 p-3 rounded-lg">
                <p className="text-white">From: {gameData.playerData[offer.fromUserId]?.nationName || 'Unknown'}</p>
                <p className="text-sm text-gray-300">Offering: {JSON.stringify(offer.offeredResources)}</p>
                <p className="text-sm text-gray-300">Requesting: {JSON.stringify(offer.requestedResources)}</p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleRespondToTradeOffer(offer.id, true)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToTradeOffer(offer.id, false)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {otherPlayers.length === 0 ? (
          <p className="text-gray-400">No other players in this game yet.</p>
        ) : (
          otherPlayers.map(playerId => {
            const playerInfo = gameData.playerData[playerId];
            const currentStance = diplomaticStances[playerId] || 'neutral';

            return (
              <div key={playerId} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{playerInfo?.nationName || 'Unknown Nation'}</p>
                  <p className="text-sm text-gray-300">Leader: {playerInfo?.leaderName || 'Unknown Leader'}</p>
                  <p className="text-sm text-gray-400">Stance: <span className="capitalize">{currentStance}</span></p>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSetStance(playerId, 'alliance')}
                      className={`px-3 py-1 rounded text-sm ${currentStance === 'alliance' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-blue-500'}`}
                      disabled={loading}
                    >
                      Alliance
                    </button>
                    <button
                      onClick={() => handleSetStance(playerId, 'rivalry')}
                      className={`px-3 py-1 rounded text-sm ${currentStance === 'rivalry' ? 'bg-red-600' : 'bg-gray-600 hover:bg-red-500'}`}
                      disabled={loading}
                    >
                      Rivalry
                    </button>
                    <button
                      onClick={() => handleSetStance(playerId, 'neutral')}
                      className={`px-3 py-1 rounded text-sm ${currentStance === 'neutral' ? 'bg-gray-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                      disabled={loading}
                    >
                      Neutral
                    </button>
                  </div>
                  <button
                    onClick={() => handleOpenTradeModal(playerId)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-1 px-3 rounded"
                    disabled={loading}
                  >
                    Offer Trade
                  </button>
                  {currentStance === 'rivalry' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeclareWar(playerId)}
                        className="bg-red-800 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                        disabled={loading}
                      >
                        Declare War
                      </button>
                      <button
                        onClick={() => handleLaunchAttack(playerId)}
                        className="bg-red-900 hover:bg-red-800 text-white text-sm py-1 px-3 rounded"
                        disabled={loading}
                      >
                        Launch Attack
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {tradeOfferModalOpen && selectedPlayerForTrade && (
        <TradeOfferModal
          isOpen={tradeOfferModalOpen}
          onClose={() => setTradeOfferModalOpen(false)}
          targetUserId={selectedPlayerForTrade}
        />
      )}
    </div>
  );
};

export default DiplomacyDashboard;