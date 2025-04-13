import { useGameStore } from '../store/gameStore';

export default function NaturalResourceDisplay() {
  const { naturalResources, population } = useGameStore();
  
  // Resource icon mapping
  const resourceIcons = {
    wood: "🌲",
    minerals: "⛏️",
    food: "🌾",
    water: "💧",
    land: "🏞️"
  };
  
  // Population icon mapping
  const populationIcons = {
    men: "👨",
    women: "👩",
    children: "👶",
    workers: "👷",
    soldiers: "💂",
    scientists: "🔬"
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3">Natural Resources</h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(naturalResources).map(([key, value]) => (
          <div key={key} className="bg-green-50 rounded p-2 text-center">
            <div className="text-xl mb-1">
              {resourceIcons[key as keyof typeof resourceIcons]}
            </div>
            <div className="font-medium capitalize text-sm">{key}</div>
            <div className="text-sm">{Math.floor(value)}</div>
          </div>
        ))}
      </div>
      
      <h3 className="text-lg font-semibold mb-3 mt-5">Population</h3>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(population).map(([key, value]) => (
          <div key={key} className="bg-blue-50 rounded p-2 text-center">
            <div className="text-xl mb-1">
              {populationIcons[key as keyof typeof populationIcons]}
            </div>
            <div className="font-medium capitalize text-sm">{key}</div>
            <div className="text-sm">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 