
import React, { useState } from 'react';
import { sendTradeOfferToFirestore } from '../utils/firebase';
import { useAuth } from '../utils/AuthContext';
import { useGameStore } from '../store/gameStore';

interface TradeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
}

const TradeOfferModal = ({ isOpen, onClose, targetUserId }: TradeOfferModalProps) => {
  const { currentUser } = useAuth();
  const { gameId, naturalResources } = useGameStore();
  const [offeredWood, setOfferedWood] = useState(0);
  const [offeredMinerals, setOfferedMinerals] = useState(0);
  const [offeredFood, setOfferedFood] = useState(0);
  const [offeredWater, setOfferedWater] = useState(0);
  const [offeredLand, setOfferedLand] = useState(0);
  const [requestedWood, setRequestedWood] = useState(0);
  const [requestedMinerals, setRequestedMinerals] = useState(0);
  const [requestedFood, setRequestedFood] = useState(0);
  const [requestedWater, setRequestedWater] = useState(0);
  const [requestedLand, setRequestedLand] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOffer = async () => {
    if (!currentUser || !gameId) {
      setError('You must be signed in and in a game to send a trade offer.');
      return;
    }

    const offeredResources = {
      wood: offeredWood,
      minerals: offeredMinerals,
      food: offeredFood,
      water: offeredWater,
      land: offeredLand,
    };

    const requestedResources = {
      wood: requestedWood,
      minerals: requestedMinerals,
      food: requestedFood,
      water: requestedWater,
      land: requestedLand,
    };

    // Basic validation: ensure offered resources are available
    if (offeredWood > naturalResources.wood ||
        offeredMinerals > naturalResources.minerals ||
        offeredFood > naturalResources.food ||
        offeredWater > naturalResources.water ||
        offeredLand > naturalResources.land) {
      setError('You cannot offer more resources than you have.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await sendTradeOfferToFirestore(gameId, currentUser.uid, targetUserId, offeredResources, requestedResources);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send trade offer.');
    } finally {
      setLoading(false);
    }
  };

  const resourceInput = (label: string, value: number, setter: React.Dispatch<React.SetStateAction<number>>, max?: number) => (
    <div className="flex items-center justify-between">
      <label className="text-gray-300 text-sm">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => setter(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
        min="0"
        max={max}
        disabled={loading}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-lg border border-gray-700 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-300 hover:text-white focus:outline-none z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Send Trade Offer</h2>
        
        {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">You Offer:</h3>
            <div className="space-y-2">
              {resourceInput('Wood', offeredWood, setOfferedWood, naturalResources.wood)}
              {resourceInput('Minerals', offeredMinerals, setOfferedMinerals, naturalResources.minerals)}
              {resourceInput('Food', offeredFood, setOfferedFood, naturalResources.food)}
              {resourceInput('Water', offeredWater, setOfferedWater, naturalResources.water)}
              {resourceInput('Land', offeredLand, setOfferedLand, naturalResources.land)}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">You Request:</h3>
            <div className="space-y-2">
              {resourceInput('Wood', requestedWood, setRequestedWood)}
              {resourceInput('Minerals', requestedMinerals, setRequestedMinerals)}
              {resourceInput('Food', requestedFood, setRequestedFood)}
              {resourceInput('Water', requestedWater, setRequestedWater)}
              {resourceInput('Land', requestedLand, setRequestedLand)}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSendOffer}
          className="game-btn w-full py-3"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Offer'}
        </button>
      </div>
    </div>
  );
};

export default TradeOfferModal;
