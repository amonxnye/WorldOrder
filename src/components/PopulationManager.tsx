import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function PopulationManager() {
  const { population, distributePeople, advanceMonth } = useGameStore();
  const [distributionAmount, setDistributionAmount] = useState(1);
  
  // Calculate available adults
  const totalAdults = population.men + population.women;
  const currentlyAssigned = population.workers + population.soldiers + population.scientists;
  const available = totalAdults - currentlyAssigned;
  
  // Function to get mood status text and color
  const getMoodStatus = () => {
    const { mood } = population;
    if (mood >= 80) return { text: 'Excellent', color: 'text-green-600' };
    if (mood >= 60) return { text: 'Good', color: 'text-green-500' };
    if (mood >= 40) return { text: 'Neutral', color: 'text-blue-500' };
    if (mood >= 20) return { text: 'Poor', color: 'text-amber-500' };
    return { text: 'Critical', color: 'text-red-600' };
  };
  
  const moodStatus = getMoodStatus();
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Population Management</h3>
        <button 
          onClick={() => advanceMonth()}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Advance Month
        </button>
      </div>
      
      {/* Population Mood */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Population Mood:</span>
          <span className={`font-semibold ${moodStatus.color}`}>
            {moodStatus.text} ({population.mood}/100)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
          <div 
            className={`h-3 rounded-full ${getMoodBarColor(population.mood)}`} 
            style={{ width: `${population.mood}%` }}
          ></div>
        </div>
      </div>
      
      {/* Available Population */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span>Unassigned Population:</span>
          <span className="font-semibold">{available}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total Adults: {totalAdults}</span>
          <span>Currently Assigned: {currentlyAssigned}</span>
        </div>
      </div>
      
      {/* Distribution Controls */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Distribution Amount:</label>
        <div className="flex space-x-2">
          {[1, 5, 10].map(amount => (
            <button
              key={amount}
              onClick={() => setDistributionAmount(amount)}
              className={`px-3 py-1 rounded ${
                distributionAmount === amount 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>
      
      {/* Role Distribution */}
      <div className="space-y-4">
        {/* Workers */}
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex justify-between mb-2">
            <div>
              <span className="text-xl mr-2">👷</span>
              <span className="font-medium">Workers: {population.workers}</span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => distributePeople('workers', -distributionAmount)}
                disabled={population.workers < distributionAmount}
                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 disabled:opacity-50"
              >
                -
              </button>
              <button
                onClick={() => distributePeople('workers', distributionAmount)}
                disabled={available < distributionAmount}
                className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600">Gather resources and produce food</p>
        </div>
        
        {/* Soldiers */}
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="flex justify-between mb-2">
            <div>
              <span className="text-xl mr-2">💂</span>
              <span className="font-medium">Soldiers: {population.soldiers}</span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => distributePeople('soldiers', -distributionAmount)}
                disabled={population.soldiers < distributionAmount}
                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 disabled:opacity-50"
              >
                -
              </button>
              <button
                onClick={() => distributePeople('soldiers', distributionAmount)}
                disabled={available < distributionAmount}
                className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600">Increase military power and stability</p>
        </div>
        
        {/* Scientists */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between mb-2">
            <div>
              <span className="text-xl mr-2">🔬</span>
              <span className="font-medium">Scientists: {population.scientists}</span>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => distributePeople('scientists', -distributionAmount)}
                disabled={population.scientists < distributionAmount}
                className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 disabled:opacity-50"
              >
                -
              </button>
              <button
                onClick={() => distributePeople('scientists', distributionAmount)}
                disabled={available < distributionAmount}
                className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600">Increase stability and culture</p>
        </div>
      </div>
      
      {/* Population Information */}
      <div className="mt-5 text-sm">
        <p>👨 Men: {population.men} | 👩 Women: {population.women} | 👶 Children: {population.children}</p>
        <p className="text-xs text-gray-500 mt-1">Population grows 10% monthly, loses 5% annually</p>
      </div>
    </div>
  );
}

// Helper to get mood bar color
function getMoodBarColor(mood: number): string {
  if (mood >= 80) return 'bg-green-600';
  if (mood >= 60) return 'bg-green-500';
  if (mood >= 40) return 'bg-blue-500';
  if (mood >= 20) return 'bg-amber-500';
  return 'bg-red-600';
} 