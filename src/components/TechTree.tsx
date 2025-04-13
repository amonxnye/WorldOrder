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

// Define era colors
const eraColors: Record<string, string> = {
  "1925–1950": "bg-amber-100 border-amber-300",
  "1950–1980": "bg-blue-100 border-blue-300",
  "1980–2000": "bg-green-100 border-green-300",
  "2000–2025": "bg-purple-100 border-purple-300",
  "2025+": "bg-rose-100 border-rose-300"
};

// Get era class based on era name
const getEraClasses = (era: string) => {
  return eraColors[era] || "bg-gray-100 border-gray-300";
};

export default function TechTree() {
  // Use game store
  const {
    selectedTech,
    unlockedTechs,
    currentEra,
    year,
    selectTech,
    advanceYear
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
    advanceYear();
  };
  
  return (
    <div className="p-4">
      {/* Game info and controls */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Current Year: {year}</h2>
            <p className="text-lg">Era: {currentEra}</p>
          </div>
          <button 
            onClick={handleYearAdvance}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Advance Year
          </button>
        </div>
      </div>
      
      {/* Era legend */}
      <div className="mb-6 flex flex-wrap gap-2">
        <h3 className="w-full text-lg font-semibold mb-2">Historical Eras:</h3>
        {Object.keys(eraColors).map((era) => (
          <div key={era} className={`flex items-center p-1 rounded ${era === currentEra ? 'bg-gray-200' : ''}`}>
            <div className={`w-4 h-4 ${eraColors[era].split(' ')[0]} border rounded mr-1`}></div>
            <span className="text-sm">{era}</span>
          </div>
        ))}
      </div>
      
      {/* Technologies unlocked counter */}
      <div className="mb-6 p-2 bg-gray-200 rounded">
        <p className="font-medium">Technologies Unlocked: {unlockedTechs.length} / {techData.branches.reduce((count, branch) => count + branch.technologies.length, 0)}</p>
      </div>
      
      {/* Main tech tree */}
      <div className="space-y-8">
        {techData.branches.map((branch: Branch) => (
          <div key={branch.name} className="mb-6">
            <h2 className="text-xl font-bold mb-3 p-2 bg-gray-800 text-white rounded">{branch.name}</h2>
            <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
              {branch.technologies.map((tech: Tech) => {
                const isAvailable = isTechAvailable(tech);
                const isUnlocked = unlockedTechs.includes(tech.id);
                const isSelected = selectedTech === tech.id;
                // Check if tech era matches current era
                const isCurrentEra = tech.era === currentEra;
                
                return (
                  <div 
                    key={tech.id}
                    className={`${getEraClasses(tech.era)} border rounded-lg p-3 shadow-md 
                      ${isAvailable && !isUnlocked ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${isUnlocked ? 'bg-green-100 border-green-500' : ''}
                      ${!isAvailable && !isUnlocked ? 'opacity-50' : ''}
                      ${isCurrentEra ? 'ring-1 ring-amber-500' : ''}
                      transition-all duration-200`}
                    onClick={() => !isUnlocked && handleTechClick(tech)}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{tech.name}</h3>
                      {isUnlocked && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Unlocked</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tech.era}</p>
                    <p className="mt-1">{tech.description}</p>
                    
                    <div className="mt-2">
                      <h4 className="font-medium text-sm">Effects:</h4>
                      <ul className="text-sm list-disc list-inside">
                        {tech.effects.map((effect, idx) => (
                          <li key={idx}>{effect}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {tech.prerequisites && tech.prerequisites.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-medium text-sm">Prerequisites:</h4>
                        <ul className="text-sm list-disc list-inside">
                          {tech.prerequisites.map((preId) => {
                            const preTech = findTech(preId);
                            const isPreUnlocked = unlockedTechs.includes(preId);
                            return (
                              <li key={preId} className={isPreUnlocked ? "text-green-600 font-medium" : ""}>
                                {preTech?.name || preId}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {tech.unlocks && tech.unlocks.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-medium text-sm">Unlocks:</h4>
                        <ul className="text-sm list-disc list-inside">
                          {tech.unlocks.map((unlockId) => {
                            const unlockTech = findTech(unlockId);
                            const isUnlockUnlocked = unlockedTechs.includes(unlockId);
                            return (
                              <li key={unlockId} className={isUnlockUnlocked ? "text-green-600 font-medium" : ""}>
                                {unlockTech?.name || unlockId}
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