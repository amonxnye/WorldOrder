import { useGameStore } from '../store/gameStore';

export default function NaturalResourceDisplay() {
  const { naturalResources, investInResource } = useGameStore();
  
  const resourceIcons = {
    wood: '🌲',
    minerals: '⛏️',
    food: '🌾',
    water: '💧',
    land: '🏞️',
  };
  
  const resourceColors = {
    wood: {
      bg: 'bg-emerald-900/30',
      border: 'border-emerald-700',
      text: 'text-emerald-300',
      progress: 'bg-emerald-500'
    },
    minerals: {
      bg: 'bg-slate-900/30',
      border: 'border-slate-700',
      text: 'text-slate-300',
      progress: 'bg-slate-500'
    },
    food: {
      bg: 'bg-amber-900/30',
      border: 'border-amber-700',
      text: 'text-amber-300',
      progress: 'bg-amber-500'
    },
    water: {
      bg: 'bg-blue-900/30',
      border: 'border-blue-700',
      text: 'text-blue-300',
      progress: 'bg-blue-500'
    },
    land: {
      bg: 'bg-green-900/30',
      border: 'border-green-700',
      text: 'text-green-300',
      progress: 'bg-green-500'
    }
  };
  
  return (
    <div className="p-4 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-md text-white">
      <h3 className="text-lg font-semibold mb-4">Natural Resources</h3>
      
      <div className="space-y-3">
        {Object.entries(naturalResources).map(([key, value]) => {
          const resourceKey = key as keyof typeof naturalResources;
          const resourceStyle = resourceColors[resourceKey];
          
          // Calculate a percentage for the resource (0-100%)
          // Using arbitrary max values for visualization
          const maxValues = { wood: 2000, minerals: 1000, food: 1500, water: 2000, land: 5000 };
          const maxValue = maxValues[resourceKey] || 1000;
          const percentage = Math.min(100, (value / maxValue) * 100);
          
          return (
            <div 
              key={key} 
              className={`${resourceStyle.bg} ${resourceStyle.border} border rounded-lg p-3 transition-all hover:shadow-md`}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{resourceIcons[resourceKey]}</span>
                  <span className={`font-medium capitalize ${resourceStyle.text}`}>{key}</span>
                </div>
                <span className="font-semibold">{value.toLocaleString()}</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                <div 
                  className={`h-2 rounded-full ${resourceStyle.progress} transition-all duration-500`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              {/* Production rate - this would be calculated based on workers */}
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>
                  Production: 
                  {key === 'wood' && ' +2 per worker'}
                  {key === 'minerals' && ' +1 per worker'}
                  {key === 'food' && ' +3 per worker'}
                  {key === 'water' && ' +2 per worker'}
                  {key === 'land' && ' limited'}
                </span>
                <span className="text-green-400 font-medium">
                  {key === 'wood' && '+'}
                  {key === 'minerals' && '+'}
                  {key === 'food' && '+'}
                  {key === 'water' && '+'}
                  {key === 'land' && ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          Resources are gathered by workers each month. Invest in economy to improve production.
        </p>
      </div>
    </div>
  );
} 