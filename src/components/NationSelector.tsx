import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Sample nations data
const NATIONS = [
  { id: 'ghana', name: 'Ghana', flag: '🇬🇭', leaderTitle: 'President', bonuses: ['Agricultural Expertise', 'Cultural Unity'] },
  { id: 'kenya', name: 'Kenya', flag: '🇰🇪', leaderTitle: 'President', bonuses: ['Industrial Innovation', 'Trade Networks'] },
  { id: 'nigeria', name: 'Nigeria', flag: '🇳🇬', leaderTitle: 'President', bonuses: ['Resource Wealth', 'Diplomatic Influence'] },
  { id: 'egypt', name: 'Egypt', flag: '🇪🇬', leaderTitle: 'President', bonuses: ['Ancient Heritage', 'Military Tradition'] },
  { id: 'ethiopia', name: 'Ethiopia', flag: '🇪🇹', leaderTitle: 'Prime Minister', bonuses: ['Independence Legacy', 'Resilience'] },
  { id: 'custom', name: 'Custom Nation', flag: '🏳️', leaderTitle: 'Leader', bonuses: ['Define your own path'] }
];

export default function NationSelector() {
  const { setNation, setLeader, resetGame } = useGameStore();
  const [selectedNation, setSelectedNation] = useState('');
  const [customNationName, setCustomNationName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [showSelector, setShowSelector] = useState(true);
  
  const handleNationSelect = (nationId: string) => {
    setSelectedNation(nationId);
    
    // If not custom, set the nation name directly
    if (nationId !== 'custom') {
      const nation = NATIONS.find(n => n.id === nationId);
      if (nation) {
        setNation(nation.name);
      }
    }
  };
  
  const handleCustomNationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomNationName(e.target.value);
    setNation(e.target.value || 'New Nation');
  };
  
  const handleLeaderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeaderName(e.target.value);
    setLeader(e.target.value || 'Anonymous Leader');
  };
  
  const handleStartGame = () => {
    // Set final values
    if (selectedNation === 'custom' && customNationName) {
      setNation(customNationName);
    }
    
    if (leaderName) {
      setLeader(leaderName);
    }
    
    // Reset game state and hide selector
    resetGame();
    setShowSelector(false);
  };
  
  if (!showSelector) {
    return (
      <button 
        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm mt-2"
        onClick={() => setShowSelector(true)}
      >
        Change Nation
      </button>
    );
  }
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Select Your Nation</h2>
      
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {NATIONS.map(nation => (
          <div 
            key={nation.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all
              ${selectedNation === nation.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            onClick={() => handleNationSelect(nation.id)}
          >
            <div className="flex items-center">
              <span className="text-3xl mr-2">{nation.flag}</span>
              <div>
                <h3 className="font-semibold">{nation.name}</h3>
                <p className="text-sm text-gray-600">Bonuses: {nation.bonuses.join(', ')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedNation === 'custom' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Nation Name
          </label>
          <input
            type="text"
            value={customNationName}
            onChange={handleCustomNationChange}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter nation name"
          />
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Leader Name
        </label>
        <input
          type="text"
          value={leaderName}
          onChange={handleLeaderNameChange}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter leader name"
        />
      </div>
      
      <button
        onClick={handleStartGame}
        disabled={!selectedNation}
        className={`w-full py-2 px-4 rounded font-medium
          ${selectedNation ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        Start as {selectedNation === 'custom' ? customNationName || 'New Nation' : NATIONS.find(n => n.id === selectedNation)?.name}
      </button>
    </div>
  );
} 