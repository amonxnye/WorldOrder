import techData from '../data/tech-tree.json';
import { useGameStore } from '../store/gameStore';

type Tech = {
  id: string;
  name: string;
  era: string;
  description: string;
  effects: string[];
  prerequisites?: string[];
  unlocks?: string[];
};

type Branch = {
  name: string;
  technologies: Tech[];
};

// Define era colors for visualization
const eraColors: { [key: string]: string } = {
  "1925–1950": "bg-blue-800 text-white border-blue-600",
  "1950–1980": "bg-green-800 text-white border-green-600",
  "1980–2000": "bg-purple-800 text-white border-purple-600",
  "2000–2025": "bg-amber-800 text-white border-amber-600",
  "2025+": "bg-red-800 text-white border-red-600",
};

// Get CSS classes for a tech based on its era
const getEraClasses = (era: string) => {
  return eraColors[era] || "bg-gray-800 text-white border-gray-600";
};

export default function TechTree() {
  // Use game store
  const {
    selectedTech,
    unlockedTechs,
    currentEra,
    year,
    selectTech,
    advanceMonth
  } = useGameStore();

  // Find a tech by ID
  const findTech = (techId: string): Tech | undefined => {
    for (const branch of techData.branches) {
      const tech = branch.technologies.find(t => t.id === techId);
      if (tech) return tech;
    }
    return undefined;
  };

  // Check if a tech is available (all prerequisites are unlocked)
  const isTechAvailable = (tech: Tech): boolean => {
    if (!tech.prerequisites || tech.prerequisites.length === 0) return true;
    return tech.prerequisites.every(preId => unlockedTechs.includes(preId));
  };

  // Handle tech selection
  const handleTechClick = (tech: Tech) => {
    if (isTechAvailable(tech)) {
      selectTech(tech.id);
    }
  };
  
  // Handle year advancement
  const handleYearAdvance = () => {
    // Advance 12 months to complete a year
    for (let i = 0; i < 12; i++) {
      advanceMonth();
    }
  };
  
  return (
    <div className="p-4">
      {/* Game info and controls */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Current Year: {year}</h2>
            <p className="text-lg text-gray-300">Era: {currentEra}</p>
          </div>
          <button 
            onClick={handleYearAdvance}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Advance Year
          </button>
        </div>
      </div>
      
      {/* Era legend */}
      <div className="mb-6 flex flex-wrap gap-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
        <h3 className="w-full text-lg font-semibold mb-2 text-white">Historical Eras:</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(eraColors).map((era) => (
            <div key={era} className={`flex items-center p-2 rounded ${era === currentEra ? 'ring-2 ring-yellow-400' : ''}`}>
              <div className={`w-4 h-4 ${eraColors[era].split(' ')[0]} border rounded mr-2`}></div>
              <span className="text-sm text-white">{era}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Technologies unlocked counter */}
      <div className="mb-6 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <p className="font-medium text-white">Technologies Unlocked: 
          <span className="ml-2 text-blue-400 font-bold">{unlockedTechs.length}</span> / 
          <span className="text-gray-300">{techData.branches.reduce((count, branch) => count + branch.technologies.length, 0)}</span>
        </p>
      </div>
      
      {/* Main tech tree */}
      <div className="space-y-8">
        {techData.branches.map((branch: Branch) => (
          <div key={branch.name} className="mb-8">
            <h2 className="text-xl font-bold mb-4 p-3 bg-gray-800 text-white rounded-lg border-l-4 border-blue-500">{branch.name}</h2>
            <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
              {branch.technologies.map((tech: Tech) => {
                const isAvailable = isTechAvailable(tech);
                const isUnlocked = unlockedTechs.includes(tech.id);
                const isSelected = selectedTech === tech.id;
                const isCurrentEra = tech.era === currentEra;
                
                return (
                  <div 
                    key={tech.id}
                    className={`border-2 rounded-lg p-4 shadow-lg
                      ${isUnlocked ? 'bg-green-900 border-green-600 text-white' : 'bg-gray-800 border-gray-700 text-white'}
                      ${isAvailable && !isUnlocked ? 'cursor-pointer hover:border-blue-500 transform hover:-translate-y-1' : 'cursor-default'}
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${!isAvailable && !isUnlocked ? 'opacity-70' : ''}
                      ${isCurrentEra && !isUnlocked ? 'border-yellow-500' : ''}
                      transition-all duration-200`}
                    onClick={() => !isUnlocked && handleTechClick(tech)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white">{tech.name}</h3>
                      {isUnlocked && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Unlocked</span>
                      )}
                    </div>
                    
                    <div className="mb-2 flex items-center">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-opacity-80 mr-2 inline-block" 
                            style={{backgroundColor: tech.era === "1925–1950" ? "#1e40af" : 
                                                   tech.era === "1950–1980" ? "#166534" : 
                                                   tech.era === "1980–2000" ? "#6b21a8" : 
                                                   tech.era === "2000–2025" ? "#92400e" : "#b91c1c"}}>
                        {tech.era}
                      </span>
                    </div>
                    
                    <p className="mt-1 mb-3 text-gray-300">{tech.description}</p>
                    
                    <div className="mt-3 bg-gray-900 p-3 rounded-md">
                      <h4 className="font-medium text-sm text-blue-400 border-b border-gray-700 pb-1 mb-2">Effects:</h4>
                      <ul className="text-sm list-inside space-y-1">
                        {tech.effects.map((effect, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="inline-block w-4 h-4 mr-2 text-green-400">•</span>
                            <span className="text-gray-300">{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {tech.prerequisites && tech.prerequisites.length > 0 && (
                      <div className="mt-3 bg-gray-900 p-3 rounded-md">
                        <h4 className="font-medium text-sm text-amber-400 border-b border-gray-700 pb-1 mb-2">Prerequisites:</h4>
                        <ul className="text-sm list-inside space-y-1">
                          {tech.prerequisites.map((preId) => {
                            const preTech = findTech(preId);
                            const isPreUnlocked = unlockedTechs.includes(preId);
                            return (
                              <li key={preId} className="flex items-start">
                                <span className={`inline-block w-4 h-4 mr-2 ${isPreUnlocked ? "text-green-400" : "text-gray-500"}`}>•</span>
                                <span className={isPreUnlocked ? "text-green-400" : "text-gray-400"}>
                                  {preTech?.name || preId}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {tech.unlocks && tech.unlocks.length > 0 && (
                      <div className="mt-3 bg-gray-900 p-3 rounded-md">
                        <h4 className="font-medium text-sm text-purple-400 border-b border-gray-700 pb-1 mb-2">Unlocks:</h4>
                        <ul className="text-sm list-inside space-y-1">
                          {tech.unlocks.map((unlockId) => {
                            const unlockTech = findTech(unlockId);
                            const isUnlockUnlocked = unlockedTechs.includes(unlockId);
                            return (
                              <li key={unlockId} className="flex items-start">
                                <span className={`inline-block w-4 h-4 mr-2 ${isUnlockUnlocked ? "text-green-400" : "text-gray-500"}`}>•</span>
                                <span className={isUnlockUnlocked ? "text-green-400" : "text-gray-400"}>
                                  {unlockTech?.name || unlockId}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 