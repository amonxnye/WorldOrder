import { create } from 'zustand';
import techData from '../data/tech-tree.json';

// Game resources
interface Resources {
  stability: number;
  economy: number;
  military: number;
  diplomacy: number;
  culture: number;
}

// Natural resources
interface NaturalResources {
  wood: number;
  minerals: number;
  food: number;
  water: number;
  land: number;
  // Advanced materials (unlocked by technology)
  steel?: number;
  oil?: number;
  electricity?: number;
  electronics?: number;
  research_points?: number;
}

// Population data
interface Population {
  men: number;
  women: number;
  children: number;
  workers: number;
  soldiers: number;
  scientists: number;
  mood: number;      // 0-100 happiness level
  monthsPassed: number; // Track months for growth
}

// Yearly objective
interface YearlyObjective {
  type: 'resources' | 'population' | 'naturalResources' | 'tech';
  target: string;
  amount: number;
  description: string;
  completed: boolean;
}

// Growth rates per resource (base values)
const GROWTH_RATES: Record<keyof Resources, number> = {
  stability: 0.02,   // 2% base growth
  economy: 0.03,     // 3% base growth
  military: 0.01,    // 1% base growth
  diplomacy: 0.015,  // 1.5% base growth
  culture: 0.025     // 2.5% base growth
};

// Maximum growth percentage (10%)
const MAX_GROWTH_PERCENTAGE = 0.1;

// Resource growth interval in ms (15 seconds)
const GROWTH_INTERVAL = 15000;

// Population constants
const MONTHLY_GROWTH_RATE = 0.1; // 10% monthly growth
const ANNUAL_LOSS_RATE = 0.05;   // 5% annual population loss
const FOOD_PER_PERSON = 4;       // Food consumed per person per month

// Multiplayer specific interfaces
interface GameEvent {
  id: string;
  type: 'trade_offer' | 'war_declared' | 'attack_launched' | 'tech_researched' | 'turn_ended';
  fromUserId?: string;
  targetUserId?: string;
  data: any;
  timestamp: number;
  read: boolean;
}

interface TurnInfo {
  currentPlayer: string;
  turnNumber: number;
  deadline?: number; // Optional turn time limit
  actionsTaken: string[]; // Track what actions were taken this turn
}

interface MultiplayerState {
  isMultiplayer: boolean;
  isHost: boolean;
  players: Record<string, {
    userId: string;
    nationName: string;
    leaderName: string;
    isOnline: boolean;
    lastSeen: number;
  }>;
  turnInfo: TurnInfo;
  gameEvents: GameEvent[];
  pendingActions: any[]; // Actions waiting to be synchronized
  syncStatus: 'synced' | 'syncing' | 'error';
}

// Game state interface
interface GameState {
  gameId: string | null;
  diplomaticStances: Record<string, 'neutral' | 'alliance' | 'rivalry'>;
  activeWars: { attackerId: string; defenderId: string; startedAt: any }[];
  
  // Multiplayer state
  multiplayer: MultiplayerState;
  
  // Resources and metrics
  resources: Resources;
  naturalResources: NaturalResources;
  population: Population;
  currentEra: string;
  year: number;
  month: number;
  
  // Growth info
  growthTimers: Record<keyof Resources, number>; // Timestamps for next growth
  
  // Technologies
  unlockedTechs: string[];
  selectedTech: string | null;
  lastTechResearched: string | null;
  
  // Nation info
  nationName: string;
  leaderName: string;
  gameStartTime: number; // When game was started
  
  // Yearly objectives
  yearlyObjectives: YearlyObjective[];
  canAdvanceYear: boolean;
  
  // Economic cycles
  economicCycle: {
    phase: 'boom' | 'bust' | 'recovery' | 'stable';
    yearsInPhase: number;
    nextCycleYear: number;
    multiplier: number; // Economic impact multiplier
  };
  
  // Debt system
  nationalDebt: {
    totalDebt: number;
    monthlyInterest: number;
    interestRate: number;
    debtHistory: Array<{
      month: number;
      year: number;
      amount: number;
      reason: string;
    }>;
  };
  
  // Actions
  selectTech: (techId: string) => void;
  advanceMonth: () => void;
  investInResource: (resourceKey: keyof Resources) => void;
  distributePeople: (role: 'workers' | 'soldiers' | 'scientists', amount: number) => void;
  takeDebt: (amount: number, reason: string) => void;
  setNation: (name: string) => void;
  setLeader: (name: string) => void;
  setGameId: (id: string | null) => void;
  setGameState: (newState: Partial<GameState>) => void;
  setDiplomaticStance: (targetUserId: string, stance: 'neutral' | 'alliance' | 'rivalry') => void;
  setWarOutcome: (attackerId: string, defenderId: string, outcome: 'win' | 'loss' | 'draw', stolenResources: any, attackerCasualties: number, defenderCasualties: number) => void;
  resetGame: () => void;
  
  // Growth actions
  triggerGrowth: (key: keyof Resources, manual?: boolean) => void;
  checkAutoGrowth: () => void;
  
  // Multiplayer actions
  initializeMultiplayer: (gameId: string, isHost: boolean, players: Record<string, any>) => void;
  updatePlayerStatus: (userId: string, isOnline: boolean) => void;
  addGameEvent: (event: Omit<GameEvent, 'id' | 'timestamp' | 'read'>) => void;
  markEventAsRead: (eventId: string) => void;
  endTurn: () => void;
  setCurrentPlayer: (playerId: string) => void;
  syncGameState: (remoteState: Partial<GameState>) => void;
  queueAction: (action: any) => void;
  processQueuedActions: () => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'error') => void;
}

// Initial era and year definitions
const ERAS = [
  { name: "1925–1950", startYear: 1925, endYear: 1950 },
  { name: "1950–1980", startYear: 1950, endYear: 1980 },
  { name: "1980–2000", startYear: 1980, endYear: 2000 },
  { name: "2000–2025", startYear: 2000, endYear: 2025 },
  { name: "2025+", startYear: 2025, endYear: 2050 }
];

// Get current era based on year
const getCurrentEra = (year: number): string => {
  for (const era of ERAS) {
    if (year >= era.startYear && year <= era.endYear) {
      return era.name;
    }
  }
  return ERAS[0].name; // Default to first era
};

// Find tech by ID
const findTech = (techId: string) => {
  for (const branch of techData.branches) {
    const tech = branch.technologies.find(t => t.id === techId);
    if (tech) return tech;
  }
  return null;
};

// Check if a tech is available (all prerequisites unlocked)
const isTechAvailable = (techId: string, unlockedTechs: string[]): boolean => {
  const tech = findTech(techId);
  if (!tech) return false;
  
  if (!tech.prerequisites || tech.prerequisites.length === 0) return true;
  return tech.prerequisites.every(preId => unlockedTechs.includes(preId));
};

// Calculate research cost based on tech
const calculateResearchCost = (techId: string, resources: Resources): Partial<Resources> => {
  const tech = findTech(techId);
  if (!tech) return {};
  
  // Base research costs by branch
  const costsByBranch: Record<string, Partial<Resources>> = {
    gov_: { stability: -5, diplomacy: -3 },
    econ_: { economy: -8, stability: -2 },
    mil_: { military: -10, economy: -5 },
    cul_: { culture: -8, diplomacy: -3 }
  };
  
  // Find which branch this tech belongs to
  let branchPrefix = '';
  if (techId.startsWith('gov_')) branchPrefix = 'gov_';
  else if (techId.startsWith('econ_')) branchPrefix = 'econ_';
  else if (techId.startsWith('mil_')) branchPrefix = 'mil_';
  else if (techId.startsWith('cul_')) branchPrefix = 'cul_';
  
  // Get base costs for this branch
  const baseCosts = costsByBranch[branchPrefix] || { stability: -3, economy: -3 };
  
  // Adjust cost based on era
  const eraMod = tech.era === "1925–1950" ? 1 : 
                 tech.era === "1950–1980" ? 1.5 :
                 tech.era === "1980–2000" ? 2 :
                 tech.era === "2000–2025" ? 2.5 : 3;
  
  // Apply era modifier to all costs
  const finalCosts: Partial<Resources> = {};
  for (const [key, value] of Object.entries(baseCosts)) {
    finalCosts[key as keyof Resources] = value * eraMod;
  }
  
  return finalCosts;
};

// Calculate natural resource costs for investment
const calculateInvestmentCost = (resourceKey: keyof Resources, economicMultiplier: number = 1.0): Partial<NaturalResources> => {
  // Different resources require different natural resources (base costs)
  const baseCostsByResource: Record<keyof Resources, Partial<NaturalResources>> = {
    stability: { food: -10, minerals: -5 },
    economy: { wood: -15, minerals: -10, land: -5 },
    military: { minerals: -20, food: -10 },
    diplomacy: { food: -5, water: -10 },
    culture: { wood: -10, water: -5 }
  };
  
  const baseCosts = baseCostsByResource[resourceKey] || {};
  
  // Add random price fluctuations (±25%) on top of economic cycle effects
  const priceFluctuationMin = 0.75;
  const priceFluctuationMax = 1.25;
  const randomFluctuation = Math.random() * (priceFluctuationMax - priceFluctuationMin) + priceFluctuationMin;
  
  // Combine economic cycle multiplier with random fluctuations
  const totalMultiplier = economicMultiplier * randomFluctuation;
  
  // Apply multiplier to all costs
  const adjustedCosts: Partial<NaturalResources> = {};
  for (const [key, cost] of Object.entries(baseCosts)) {
    if (cost !== undefined) {
      adjustedCosts[key as keyof NaturalResources] = Math.floor(cost * totalMultiplier);
    }
  }
  
  return adjustedCosts;
};

// Apply tech effects to resources (simplified for demo)
const applyTechEffects = (resources: Resources, techId: string): Resources => {
  const tech = findTech(techId);
  if (!tech) return resources;
  
  // Clone resources object
  const newResources = { ...resources };
  
  // Simple effects parser
  tech.effects.forEach(effect => {
    const match = effect.match(/([+-]\d+)%\s+(\w+)/);
    if (match) {
      const [_, valueStr, stat] = match;
      const value = parseInt(valueStr) / 100; // Convert percentage to decimal
      
      switch (stat.toLowerCase()) {
        case 'stability':
          newResources.stability += value * 100;
          break;
        case 'morale':
        case 'unity':
        case 'control':
          newResources.stability += value * 50;
          break;
        case 'gdp':
        case 'growth':
        case 'industry':
        case 'manufacturing':
          newResources.economy += value * 100;
          break;
        case 'military':
        case 'defense':
          newResources.military += value * 100;
          break;
        case 'foreign':
        case 'diplomacy':
        case 'influence':
          newResources.diplomacy += value * 100;
          break;
        case 'cultural':
        case 'education':
          newResources.culture += value * 100;
          break;
      }
    }
  });
  
  // Apply research costs
  const researchCosts = calculateResearchCost(techId, resources);
  for (const [key, value] of Object.entries(researchCosts)) {
    newResources[key as keyof Resources] += value || 0;
  }
  
  // Ensure resources don't go below 0
  Object.keys(newResources).forEach(key => {
    newResources[key as keyof Resources] = Math.max(0, newResources[key as keyof Resources]);
  });
  
  return newResources;
};

// Calculate growth rate modifiers based on technologies
const calculateGrowthModifiers = (unlockedTechs: string[], scientists: number = 0): Record<keyof Resources, number> => {
  const modifiers: Record<keyof Resources, number> = {
    stability: 1,
    economy: 1,
    military: 1,
    diplomacy: 1,
    culture: 1
  };
  
  // Base technology multipliers
  unlockedTechs.forEach(techId => {
    const tech = findTech(techId);
    if (!tech) return;
    
    // Check tech effects for growth rate modifiers
    tech.effects.forEach(effect => {
      const match = effect.match(/([+-]\d+)%\s+(\w+)/);
      if (match) {
        const [_, valueStr, stat] = match;
        const value = parseInt(valueStr) / 100; // Convert percentage to decimal
        
        switch (stat.toLowerCase()) {
          case 'stability':
            modifiers.stability += value * 0.5;
            break;
          case 'gdp':
          case 'growth':
          case 'industry':
            modifiers.economy += value * 0.5;
            break;
          case 'military':
            modifiers.military += value * 0.5;
            break;
          case 'diplomacy':
          case 'influence':
            modifiers.diplomacy += value * 0.5;
            break;
          case 'cultural':
          case 'education':
            modifiers.culture += value * 0.5;
            break;
        }
      }
    });
  });
  
  // EXPONENTIAL SCALING: Education × Technology synergies
  const educationLevels = {
    none: 0,
    basic: unlockedTechs.includes('cul_public_education') ? 1 : 0,
    higher: unlockedTechs.includes('cul_higher_education') ? 2 : 0,
    advanced: unlockedTechs.includes('cul_advanced_research') ? 3 : 0
  };
  
  const educationLevel = Math.max(...Object.values(educationLevels));
  
  // Advanced technology synergies with exponential scaling
  const techCombos = [
    {
      // Industrial Revolution combo
      techs: ['eco_industrial_revolution', 'eco_steam_power'],
      bonus: { economy: educationLevel * 0.5, military: educationLevel * 0.2 }
    },
    {
      // Scientific Method combo
      techs: ['cul_scientific_method', 'cul_higher_education'],
      bonus: { culture: educationLevel * 0.8, economy: educationLevel * 0.3 }
    },
    {
      // Modern Democracy combo
      techs: ['gov_democracy', 'cul_public_education'],
      bonus: { stability: educationLevel * 0.6, diplomacy: educationLevel * 0.4 }
    },
    {
      // Information Age combo
      techs: ['eco_computers', 'cul_higher_education', 'eco_internet'],
      bonus: { economy: educationLevel * 1.2, culture: educationLevel * 0.8 }
    }
  ];
  
  // Apply exponential bonuses for technology combinations
  techCombos.forEach(combo => {
    const hasAllTechs = combo.techs.every(tech => unlockedTechs.includes(tech));
    if (hasAllTechs) {
      Object.entries(combo.bonus).forEach(([resource, bonus]) => {
        if (resource in modifiers) {
          modifiers[resource as keyof Resources] += bonus as number;
        }
      });
    }
  });
  
  // Scientists provide exponential scaling with education
  if (scientists > 0) {
    const baseScientistBonus = scientists * 0.02; // 2% per scientist
    const educationMultiplier = 1 + (educationLevel * 0.5); // Up to 2.5x with max education
    const exponentialScientistBonus = baseScientistBonus * educationMultiplier;
    
    Object.keys(modifiers).forEach(key => {
      modifiers[key as keyof Resources] += exponentialScientistBonus;
    });
    
    // Special research breakthrough bonus for high scientist + education combinations
    if (scientists >= 5 && educationLevel >= 2) {
      const breakthroughMultiplier = 1 + (scientists - 4) * 0.1 * educationLevel;
      Object.keys(modifiers).forEach(key => {
        modifiers[key as keyof Resources] *= breakthroughMultiplier;
      });
    }
  }
  
  // Infrastructure compound bonuses (if multiple infrastructure techs are unlocked)
  const infrastructureTechs = unlockedTechs.filter(tech => 
    tech.includes('road') || tech.includes('railroad') || tech.includes('highway') || 
    tech.includes('power') || tech.includes('telecommunication')
  ).length;
  
  if (infrastructureTechs > 1) {
    const infrastructureBonus = Math.pow(1.15, infrastructureTechs - 1); // Compound 15% per additional infrastructure
    modifiers.economy *= infrastructureBonus;
    modifiers.stability *= Math.pow(1.05, infrastructureTechs - 1);
  }
  
  // Ensure minimum growth but allow for massive scaling
  Object.keys(modifiers).forEach(key => {
    modifiers[key as keyof Resources] = Math.max(0.1, Math.min(10, modifiers[key as keyof Resources])); // Cap at 10x for balance
  });
  
  return modifiers;
};

// Create initial growth timers
const createInitialGrowthTimers = (): Record<keyof Resources, number> => {
  const now = Date.now();
  return {
    stability: now + GROWTH_INTERVAL,
    economy: now + GROWTH_INTERVAL,
    military: now + GROWTH_INTERVAL,
    diplomacy: now + GROWTH_INTERVAL,
    culture: now + GROWTH_INTERVAL
  };
};

// Calculate total population
const calculateTotalPopulation = (population: Population): number => {
  return population.men + population.women + population.children;
};

// Calculate food consumption
const calculateFoodConsumption = (population: Population): number => {
  const totalPopulation = calculateTotalPopulation(population);
  return totalPopulation * FOOD_PER_PERSON;
};

// Generate yearly objectives based on current state
const generateYearlyObjectives = (
  resources: Resources, 
  naturalResources: NaturalResources, 
  population: Population,
  year: number,
  unlockedTechs: string[]
): YearlyObjective[] => {
  const objectives: YearlyObjective[] = [];
  const totalPopulation = calculateTotalPopulation(population);
  
  // Add resource objective (always at least one)
  const resourceKeys = Object.keys(resources) as Array<keyof Resources>;
  const targetResourceKey = resourceKeys[Math.floor(Math.random() * resourceKeys.length)];
  const currentResourceValue = resources[targetResourceKey];
  const resourceTarget = Math.min(100, Math.round(currentResourceValue * 1.3)); // 30% increase
  
  objectives.push({
    type: 'resources',
    target: targetResourceKey,
    amount: resourceTarget,
    description: `Increase ${targetResourceKey} to ${resourceTarget}`,
    completed: currentResourceValue >= resourceTarget
  });
  
  // Add population objective (higher years)
  if (year > ERAS[0].startYear + 2) {
    const popTarget = Math.round(totalPopulation * 1.25); // 25% population growth
    objectives.push({
      type: 'population',
      target: 'total',
      amount: popTarget,
      description: `Grow population to ${popTarget} people`,
      completed: totalPopulation >= popTarget
    });
  }
  
  // Add natural resource stockpile objective
  const naturalResourceKeys = Object.keys(naturalResources) as Array<keyof NaturalResources>;
  const targetNaturalKey = naturalResourceKeys[Math.floor(Math.random() * naturalResourceKeys.length)];
  const currentNaturalValue = naturalResources[targetNaturalKey];
  const naturalTarget = Math.round(currentNaturalValue * 1.2); // 20% increase
  
  objectives.push({
    type: 'naturalResources',
    target: targetNaturalKey,
    amount: naturalTarget,
    description: `Stockpile ${naturalTarget} ${targetNaturalKey}`,
    completed: currentNaturalValue >= naturalTarget
  });
  
  // Add tech objective for later years
  if (year > ERAS[0].startYear + 5) {
    const techCount = unlockedTechs.length;
    const techTarget = techCount + 1; // At least one new tech
    
    objectives.push({
      type: 'tech',
      target: 'count',
      amount: techTarget,
      description: `Research at least ${techTarget} technologies`,
      completed: unlockedTechs.length >= techTarget
    });
  }
  
  // Add happiness objective if population mood is low
  if (population.mood < 70) {
    objectives.push({
      type: 'population',
      target: 'mood',
      amount: 70,
      description: 'Improve population mood to at least 70',
      completed: population.mood >= 70
    });
  }
  
  return objectives;
};

// Check if all yearly objectives are completed
const checkObjectivesCompleted = (objectives: YearlyObjective[]): boolean => {
  return objectives.every(obj => obj.completed);
};

// Update objectives completion status
const updateObjectivesStatus = (
  objectives: YearlyObjective[],
  resources: Resources,
  naturalResources: NaturalResources,
  population: Population,
  unlockedTechs: string[]
): YearlyObjective[] => {
  return objectives.map(obj => {
    const updated = { ...obj };
    
    switch (obj.type) {
      case 'resources':
        updated.completed = resources[obj.target as keyof Resources] >= obj.amount;
        break;
      case 'naturalResources':
        updated.completed = naturalResources[obj.target as keyof NaturalResources] >= obj.amount;
        break;
      case 'population':
        if (obj.target === 'total') {
          updated.completed = calculateTotalPopulation(population) >= obj.amount;
        } else if (obj.target === 'mood') {
          updated.completed = population.mood >= obj.amount;
        }
        break;
      case 'tech':
        updated.completed = unlockedTechs.length >= obj.amount;
        break;
    }
    
    return updated;
  });
};

// Create the store
export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  gameId: null,
  diplomaticStances: {},
  activeWars: [],
  multiplayer: {
    isMultiplayer: false,
    isHost: false,
    players: {},
    turnInfo: {
      currentPlayer: '',
      turnNumber: 1,
      actionsTaken: []
    },
    gameEvents: [],
    pendingActions: [],
    syncStatus: 'synced'
  },
  resources: {
    stability: 10,
    economy: 5,
    military: 3,
    diplomacy: 1,
    culture: 2
  },
  naturalResources: {
    wood: 125,
    minerals: 75,
    food: 100,
    water: 150,
    land: 250,
    steel: 0,
    oil: 0,
    electricity: 0,
    electronics: 0,
    research_points: 0
  },
  population: {
    men: 5,
    women: 5,
    children: 0,
    workers: 7,
    soldiers: 0,
    scientists: 0,
    mood: 70,
    monthsPassed: 0
  },
  currentEra: ERAS[0].name,
  year: ERAS[0].startYear,
  month: 1,
  growthTimers: createInitialGrowthTimers(),
  unlockedTechs: [],
  selectedTech: null,
  lastTechResearched: null,
  nationName: "New Nation",
  leaderName: "Anonymous Leader",
  gameStartTime: Date.now(),
  yearlyObjectives: [],
  canAdvanceYear: false,
  economicCycle: {
    phase: 'stable',
    yearsInPhase: 0,
    nextCycleYear: 1930, // First cycle in 5 years
    multiplier: 1.0
  },
  nationalDebt: {
    totalDebt: 0,
    monthlyInterest: 0,
    interestRate: 0.05, // 5% annual interest rate
    debtHistory: []
  },
  
  // Actions
  selectTech: (techId: string) => {
    const { unlockedTechs, resources, yearlyObjectives } = get();
    
    // Check if tech is already unlocked
    if (unlockedTechs.includes(techId)) return;
    
    // Check if tech is available
    if (!isTechAvailable(techId, unlockedTechs)) return;
    
    // Get tech name
    const tech = findTech(techId);
    if (!tech) return;
    
    // Add to unlocked techs
    const newUnlockedTechs = [...unlockedTechs, techId];
    
    // Apply effects
    const newResources = applyTechEffects(resources, techId);
    
    // Update objectives status
    const { naturalResources, population } = get();
    const updatedObjectives = updateObjectivesStatus(
      yearlyObjectives,
      newResources,
      naturalResources,
      population,
      newUnlockedTechs
    );
    
    // Check if all objectives are completed
    const allCompleted = checkObjectivesCompleted(updatedObjectives);
    
    set({
      unlockedTechs: newUnlockedTechs,
      selectedTech: techId,
      lastTechResearched: tech.name,
      resources: newResources,
      yearlyObjectives: updatedObjectives,
      canAdvanceYear: allCompleted
    });
    
    // Clear the lastTechResearched after 3 seconds
    setTimeout(() => {
      set(state => {
        if (state.lastTechResearched === tech.name) {
          return { lastTechResearched: null };
        }
        return state;
      });
    }, 3000);
  },
  
  // Invest in a specific resource (manual growth)
  investInResource: (resourceKey: keyof Resources) => {
    const { resources, naturalResources, unlockedTechs, population, yearlyObjectives, economicCycle } = get();
    
    // Calculate growth modifiers based on unlocked techs and scientists
    const growthModifiers = calculateGrowthModifiers(unlockedTechs, population.scientists);
    
    // Calculate growth amount (base rate * modifier, but cap at MAX_GROWTH_PERCENTAGE)
    const baseGrowthRate = 0.05; // 5% base growth rate for investments
    const modifiedRate = baseGrowthRate * growthModifiers[resourceKey];
    const actualRate = Math.min(modifiedRate, MAX_GROWTH_PERCENTAGE);
    
    // Calculate natural resource costs with economic cycle effects
    const investmentCosts = calculateInvestmentCost(resourceKey, economicCycle.multiplier);
    
    // Check if we have enough natural resources
    let hasEnoughResources = true;
    const newNaturalResources = { ...naturalResources };
    
    for (const [key, cost] of Object.entries(investmentCosts)) {
      const currentAmount = newNaturalResources[key as keyof NaturalResources];
      if (currentAmount + (cost || 0) < 0) {
        // Not enough of this resource
        hasEnoughResources = false;
        break;
      }
    }
    
    if (!hasEnoughResources) {
      // Cannot invest due to insufficient resources
      return;
    }
    
    // Apply costs to natural resources
    for (const [key, cost] of Object.entries(investmentCosts)) {
      newNaturalResources[key as keyof NaturalResources] += cost || 0;
    }
    
    // Apply growth to the selected resource
    const newResources = { ...resources };
    const growthAmount = newResources[resourceKey] * actualRate;
    newResources[resourceKey] = Math.min(100, newResources[resourceKey] + growthAmount);
    
    // Affect population mood based on resource invested
    const newPopulation = { ...population };
    
    // Extra mood boost when investing in culture (education)
    if (resourceKey === 'culture') {
      newPopulation.mood = Math.min(100, newPopulation.mood + 3);
    } else {
      newPopulation.mood = Math.min(100, newPopulation.mood + 2);
    }
    
    // Update objectives status
    const updatedObjectives = updateObjectivesStatus(
      yearlyObjectives,
      newResources,
      newNaturalResources,
      newPopulation,
      unlockedTechs
    );
    
    // Check if all objectives are completed
    const allCompleted = checkObjectivesCompleted(updatedObjectives);
    
    set({
      resources: newResources,
      naturalResources: newNaturalResources,
      population: newPopulation,
      yearlyObjectives: updatedObjectives,
      canAdvanceYear: allCompleted
    });
  },
  
  // Distribute people between different roles
  distributePeople: (role: 'workers' | 'soldiers' | 'scientists', amount: number) => {
    const { population, yearlyObjectives, resources, naturalResources, unlockedTechs } = get();
    const newPopulation = { ...population };
    
    // Calculate available adults
    const totalAdults = population.men + population.women;
    const currentlyAssigned = population.workers + population.soldiers + population.scientists;
    const available = totalAdults - currentlyAssigned;
    
    // Check if we're trying to add or remove
    if (amount > 0) {
      // Adding people to role
      if (amount > available) {
        // Not enough available people
        return;
      }
      
      // Add people to specified role
      newPopulation[role] += amount;
    } else {
      // Removing people from role
      const absAmount = Math.abs(amount);
      if (absAmount > newPopulation[role]) {
        // Not enough people in this role to remove
        return;
      }
      
      // Remove people from specified role
      newPopulation[role] -= absAmount;
    }
    
    // Update objectives status
    const updatedObjectives = updateObjectivesStatus(
      yearlyObjectives,
      resources,
      naturalResources,
      newPopulation,
      unlockedTechs
    );
    
    // Check if all objectives are completed
    const allCompleted = checkObjectivesCompleted(updatedObjectives);
    
    set({ 
      population: newPopulation,
      yearlyObjectives: updatedObjectives,
      canAdvanceYear: allCompleted
    });
  },
  
  // Take on national debt for immediate resources
  takeDebt: (amount: number, reason: string) => {
    const { nationalDebt, resources, naturalResources, year, month } = get();
    
    // Add to national debt
    const newNationalDebt = { ...nationalDebt };
    newNationalDebt.totalDebt += amount;
    newNationalDebt.debtHistory.push({
      month,
      year,
      amount,
      reason
    });
    
    // Convert debt to immediate economic boost and resources
    const newResources = { ...resources };
    const newNaturalResources = { ...naturalResources };
    
    // Economic boost from debt spending
    newResources.economy = Math.min(100, newResources.economy + amount * 0.1);
    newResources.stability = Math.min(100, newResources.stability + amount * 0.05);
    
    // Convert debt to natural resources (government investment)
    const resourcesPerDebt = amount / 4; // Divide debt among 4 resources
    newNaturalResources.food += Math.floor(resourcesPerDebt);
    newNaturalResources.wood += Math.floor(resourcesPerDebt);
    newNaturalResources.minerals += Math.floor(resourcesPerDebt * 0.5);
    newNaturalResources.water += Math.floor(resourcesPerDebt);
    
    // Higher interest rate for larger debts (risk premium)
    if (newNationalDebt.totalDebt > 500) {
      newNationalDebt.interestRate = Math.min(0.15, 0.05 + (newNationalDebt.totalDebt - 500) * 0.00005);
    }
    
    console.log(`💳 DEBT TAKEN: ${amount} for ${reason}. Total debt: ${newNationalDebt.totalDebt.toFixed(0)}`);
    
    set({
      nationalDebt: newNationalDebt,
      resources: newResources,
      naturalResources: newNaturalResources
    });
  },
  
  // Advance one month
  advanceMonth: () => {
    const { year, month, population, naturalResources, resources, unlockedTechs, yearlyObjectives, canAdvanceYear } = get();
    
    // Calculate new month and year
    let newMonth = month + 1;
    let newYear = year;
    
    // Only advance to a new year if all objectives are completed (December)
    let yearChanged = false;
    if (newMonth > 12) {
      if (canAdvanceYear) {
        newMonth = 1;
        newYear++;
        yearChanged = true;
      } else {
        // Can't advance year yet, stay at December
        newMonth = 12;
      }
    }
    
    const newEra = getCurrentEra(newYear);
    
    // Clone state objects for updates
    const newPopulation = { ...population };
    const newNaturalResources = { ...naturalResources };
    const newResources = { ...resources };
    
    // Increment months passed
    newPopulation.monthsPassed++;
    
    // Monthly 10% population growth
    const totalPopulation = calculateTotalPopulation(population);
    const growthFactor = MONTHLY_GROWTH_RATE;
    
    // Add new children based on number of women (simplified)
    const potentialNewChildren = Math.floor(newPopulation.women * growthFactor);
    newPopulation.children += potentialNewChildren;
    
    // Some children grow up
    if (newPopulation.children > 0) {
      const comingOfAgeRate = 0.02; // 2% of children become adults each month
      const newAdults = Math.floor(newPopulation.children * comingOfAgeRate);
      newPopulation.children -= newAdults;
      
      // Split new adults between men and women
      const newMen = Math.floor(newAdults / 2);
      const newWomen = newAdults - newMen;
      newPopulation.men += newMen;
      newPopulation.women += newWomen;
    }
    
    // If this is December (year end), apply annual 5% loss
    if (month === 12) {
      const lossRate = ANNUAL_LOSS_RATE;
      
      // Apply losses (from disease, accidents, etc.)
      newPopulation.men = Math.floor(newPopulation.men * (1 - lossRate));
      newPopulation.women = Math.floor(newPopulation.women * (1 - lossRate));
      newPopulation.children = Math.floor(newPopulation.children * (1 - lossRate));
      
      // Adjust workers, soldiers, scientists if necessary
      const totalAdults = newPopulation.men + newPopulation.women;
      const currentlyAssigned = newPopulation.workers + newPopulation.soldiers + newPopulation.scientists;
      
      if (currentlyAssigned > totalAdults) {
        // We need to reduce assignments proportionally
        const reductionFactor = totalAdults / currentlyAssigned;
        newPopulation.workers = Math.floor(newPopulation.workers * reductionFactor);
        newPopulation.soldiers = Math.floor(newPopulation.soldiers * reductionFactor);
        newPopulation.scientists = Math.floor(newPopulation.scientists * reductionFactor);
      }
    }
    
    // Apply food spoilage (7% monthly loss)
    const spoilageRate = 0.07;
    newNaturalResources.food = Math.floor(newNaturalResources.food * (1 - spoilageRate));
    
    // Calculate food consumption
    const foodConsumption = calculateFoodConsumption(newPopulation);
    
    // Check if we have enough food
    if (newNaturalResources.food >= foodConsumption) {
      // Enough food for everyone
      newNaturalResources.food -= foodConsumption;
      
      // Mood slightly improves if well-fed
      newPopulation.mood = Math.min(100, newPopulation.mood + 1);
    } else {
      // Not enough food! People are hungry
      const foodShortage = foodConsumption - newNaturalResources.food;
      newNaturalResources.food = 0;
      
      // Mood drops significantly due to hunger
      const moodDrop = Math.floor((foodShortage / foodConsumption) * 10);
      newPopulation.mood = Math.max(0, newPopulation.mood - moodDrop);
      
      // If severe food shortage, may lose some population
      if (moodDrop > 5) {
        const starvationRate = moodDrop / 100;
        newPopulation.children = Math.floor(newPopulation.children * (1 - starvationRate));
        newPopulation.men = Math.floor(newPopulation.men * (1 - starvationRate * 0.5));
        newPopulation.women = Math.floor(newPopulation.women * (1 - starvationRate * 0.5));
      }
    }
    
    // Generate resources based on assigned roles
    newNaturalResources.food += newPopulation.workers * 3;
    newNaturalResources.wood += newPopulation.workers * 2;
    newNaturalResources.minerals += newPopulation.workers * 1;
    newNaturalResources.water += newPopulation.workers * 2;
    
    // Scientists improve tech progress
    if (newPopulation.scientists > 0) {
      // Boost to stability and culture from scientists
      newResources.stability += newPopulation.scientists * 0.2;
      newResources.culture += newPopulation.scientists * 0.3;
      
      // Cap resources at 100
      newResources.stability = Math.min(100, newResources.stability);
      newResources.culture = Math.min(100, newResources.culture);
    }
    
    // Soldiers improve military and stability
    if (newPopulation.soldiers > 0) {
      // Boost to military and stability from soldiers
      newResources.military += newPopulation.soldiers * 0.3;
      newResources.stability += newPopulation.soldiers * 0.1;
      
      // Cap resources at 100
      newResources.military = Math.min(100, newResources.military);
      newResources.stability = Math.min(100, newResources.stability);
    }
    
    // RESOURCE INTERDEPENDENCY CHAINS - Advanced Material Production
    
    // Steel Production (requires Iron Age tech): Iron (minerals) + Coal (minerals) + Workers
    if (unlockedTechs.includes('mil_iron_age') && newNaturalResources.minerals >= 20 && newPopulation.workers >= 2) {
      const steelProduction = Math.floor(Math.min(newNaturalResources.minerals / 20, newPopulation.workers / 2));
      newNaturalResources.steel = (newNaturalResources.steel || 0) + steelProduction * 5;
      newNaturalResources.minerals -= steelProduction * 15; // Use less minerals thanks to efficiency
      console.log(`⚙️ Steel production: +${steelProduction * 5} steel from ${steelProduction * 15} minerals`);
    }
    
    // Oil Discovery & Production (requires 1950+ and Industrial Revolution)
    if (newYear >= 1950 && unlockedTechs.includes('eco_industrial_revolution')) {
      // Random oil discovery (5% chance per year if no oil yet)
      if (!newNaturalResources.oil && Math.random() < 0.05) {
        newNaturalResources.oil = Math.floor(Math.random() * 200) + 100; // 100-300 oil discovered
        console.log(`🛢️ Oil discovered! +${newNaturalResources.oil} oil reserves`);
        
        if (get().gameId) {
          get().addGameEvent({
            type: 'resource_discovery',
            fromUserId: 'system',
            data: { resourceType: 'oil', amount: newNaturalResources.oil, year: newYear }
          });
        }
      }
      
      // Oil extraction (requires workers and depletes over time)
      if (newNaturalResources.oil && newNaturalResources.oil > 0 && newPopulation.workers >= 3) {
        const oilExtraction = Math.min(Math.floor(newPopulation.workers / 3), Math.floor(newNaturalResources.oil * 0.1));
        newNaturalResources.oil = Math.max(0, (newNaturalResources.oil || 0) - oilExtraction);
        // Oil converted to economy boost
        newResources.economy = Math.min(100, newResources.economy + oilExtraction * 0.5);
      }
    }
    
    // Electricity Production (requires Power tech): Coal + Water + Infrastructure
    if (unlockedTechs.includes('eco_electricity') && newNaturalResources.minerals >= 10 && newNaturalResources.water >= 15) {
      const electricityProduction = Math.floor(Math.min(newNaturalResources.minerals / 10, newNaturalResources.water / 15));
      newNaturalResources.electricity = (newNaturalResources.electricity || 0) + electricityProduction * 3;
      newNaturalResources.minerals -= electricityProduction * 8;
      newNaturalResources.water -= electricityProduction * 12;
      
      // Electricity boosts all other production
      if (electricityProduction > 0) {
        newNaturalResources.food += electricityProduction * 2; // Better food processing
        newNaturalResources.wood += electricityProduction; // Powered sawmills
      }
    }
    
    // Electronics Production (requires Computers tech): Steel + Electricity + Scientists
    if (unlockedTechs.includes('eco_computers') && 
        (newNaturalResources.steel || 0) >= 5 && 
        (newNaturalResources.electricity || 0) >= 3 && 
        newPopulation.scientists >= 1) {
      
      const electronicsProduction = Math.floor(Math.min(
        (newNaturalResources.steel || 0) / 5,
        (newNaturalResources.electricity || 0) / 3,
        newPopulation.scientists
      ));
      
      if (electronicsProduction > 0) {
        newNaturalResources.electronics = (newNaturalResources.electronics || 0) + electronicsProduction * 2;
        newNaturalResources.steel = (newNaturalResources.steel || 0) - electronicsProduction * 4;
        newNaturalResources.electricity = (newNaturalResources.electricity || 0) - electronicsProduction * 2;
        
        // Electronics provide massive tech research boost
        newNaturalResources.research_points = (newNaturalResources.research_points || 0) + electronicsProduction * 10;
        newResources.culture += electronicsProduction * 2; // Information age culture
      }
    }
    
    // Research Points generation (Scientists + Education)
    if (newPopulation.scientists > 0) {
      const educationMultiplier = unlockedTechs.includes('cul_higher_education') ? 3 : 
                                  unlockedTechs.includes('cul_public_education') ? 2 : 1;
      const researchGeneration = newPopulation.scientists * educationMultiplier;
      newNaturalResources.research_points = (newNaturalResources.research_points || 0) + researchGeneration;
    }
    
    // RESEARCH BREAKTHROUGH MECHANICS (1-5% chance per month)
    if (newPopulation.scientists >= 3) {
      // Base breakthrough chance increases with scientists and education
      const baseChance = 0.01; // 1% base chance
      const scientistBonus = (newPopulation.scientists - 2) * 0.005; // 0.5% per scientist above 2
      const educationBonus = unlockedTechs.includes('cul_higher_education') ? 0.02 : 
                             unlockedTechs.includes('cul_public_education') ? 0.01 : 0;
      const researchPointsBonus = Math.min(0.02, (newNaturalResources.research_points || 0) * 0.0001); // Bonus from accumulated research
      
      const totalBreakthroughChance = baseChance + scientistBonus + educationBonus + researchPointsBonus;
      
      if (Math.random() < totalBreakthroughChance) {
        const breakthroughs = [
          {
            name: "Agricultural Innovation",
            effects: () => {
              newNaturalResources.food = Math.floor((newNaturalResources.food || 0) * 1.5);
              newResources.economy += 5;
            }
          },
          {
            name: "Industrial Efficiency",
            effects: () => {
              newNaturalResources.steel = (newNaturalResources.steel || 0) + 50;
              newResources.economy += 8;
            }
          },
          {
            name: "Medical Breakthrough",
            effects: () => {
              newPopulation.mood = Math.min(100, newPopulation.mood + 25);
              // Reduce population loss rates temporarily
              newPopulation.children += Math.floor(totalPop * 0.02);
            }
          },
          {
            name: "Energy Revolution",
            effects: () => {
              newNaturalResources.electricity = (newNaturalResources.electricity || 0) + 30;
              newResources.economy += 12;
              newResources.stability += 5;
            }
          },
          {
            name: "Communications Advance",
            effects: () => {
              newResources.diplomacy += 10;
              newResources.culture += 8;
              newNaturalResources.research_points = (newNaturalResources.research_points || 0) + 100;
            }
          },
          {
            name: "Military Innovation",
            effects: () => {
              newResources.military += 15;
              newResources.stability += 3;
            }
          }
        ];
        
        // Filter breakthroughs based on current era and tech level
        let availableBreakthroughs = breakthroughs;
        
        if (newYear < 1900) {
          availableBreakthroughs = breakthroughs.filter(b => 
            b.name === "Agricultural Innovation" || b.name === "Medical Breakthrough"
          );
        } else if (newYear < 1950) {
          availableBreakthroughs = breakthroughs.filter(b => 
            b.name !== "Energy Revolution" && b.name !== "Communications Advance"
          );
        }
        
        const breakthrough = availableBreakthroughs[Math.floor(Math.random() * availableBreakthroughs.length)];
        breakthrough.effects();
        
        // Consume research points for breakthrough
        newNaturalResources.research_points = Math.max(0, (newNaturalResources.research_points || 0) - 50);
        
        // Add breakthrough event to multiplayer feed
        if (get().gameId) {
          get().addGameEvent({
            type: 'research_breakthrough',
            fromUserId: 'system',
            data: {
              breakthroughType: breakthrough.name,
              scientists: newPopulation.scientists,
              year: newYear
            }
          });
        }
        
        console.log(`🔬 RESEARCH BREAKTHROUGH: ${breakthrough.name}! Your scientists have achieved a major discovery!`);
      }
    }
    
    // Apply resource depletion based on population and industry
    const totalPop = calculateTotalPopulation(newPopulation);
    const industryLevel = newPopulation.workers;
    
    // Base depletion rates (natural resource consumption)
    const woodDepletion = Math.max(1, Math.floor(totalPop * 0.1 + industryLevel * 0.2));
    const mineralsDepletion = Math.max(1, Math.floor(totalPop * 0.05 + industryLevel * 0.15));
    const waterDepletion = Math.max(1, Math.floor(totalPop * 0.2 + industryLevel * 0.1));
    
    // Apply depletion (minimum 0 for each resource)
    newNaturalResources.wood = Math.max(0, newNaturalResources.wood - woodDepletion);
    newNaturalResources.minerals = Math.max(0, newNaturalResources.minerals - mineralsDepletion);
    newNaturalResources.water = Math.max(0, newNaturalResources.water - waterDepletion);
    
    // Land degradation from overuse (if workers > available land/10)
    const landCapacity = newNaturalResources.land / 10;
    if (industryLevel > landCapacity) {
      const overuse = industryLevel - landCapacity;
      const landDegradation = Math.floor(overuse * 0.1);
      newNaturalResources.land = Math.max(50, newNaturalResources.land - landDegradation); // minimum 50 land
    }
    
    // Crisis Management - Random disasters (3% chance per month)
    const disasterChance = Math.random();
    if (disasterChance < 0.03) {
      const disasters = [
        {
          name: "Drought",
          effects: () => {
            newNaturalResources.food = Math.floor(newNaturalResources.food * 0.7);
            newNaturalResources.water = Math.floor(newNaturalResources.water * 0.6);
            newPopulation.mood = Math.max(0, newPopulation.mood - 15);
          }
        },
        {
          name: "Earthquake",
          effects: () => {
            newNaturalResources.minerals = Math.floor(newNaturalResources.minerals * 0.8);
            newNaturalResources.wood = Math.floor(newNaturalResources.wood * 0.9);
            newPopulation.mood = Math.max(0, newPopulation.mood - 20);
            // Population casualties
            const casualties = Math.floor(totalPop * 0.02);
            newPopulation.men = Math.max(0, newPopulation.men - Math.floor(casualties * 0.4));
            newPopulation.women = Math.max(0, newPopulation.women - Math.floor(casualties * 0.4));
            newPopulation.children = Math.max(0, newPopulation.children - Math.floor(casualties * 0.2));
          }
        },
        {
          name: "Disease Outbreak",
          effects: () => {
            const infectionRate = 0.15;
            newPopulation.men = Math.floor(newPopulation.men * (1 - infectionRate));
            newPopulation.women = Math.floor(newPopulation.women * (1 - infectionRate));
            newPopulation.children = Math.floor(newPopulation.children * (1 - infectionRate * 0.8));
            newPopulation.mood = Math.max(0, newPopulation.mood - 25);
            newResources.stability = Math.max(0, newResources.stability - 10);
          }
        },
        {
          name: "Economic Recession",
          effects: () => {
            newResources.economy = Math.max(0, newResources.economy - 15);
            newResources.stability = Math.max(0, newResources.stability - 8);
            newPopulation.mood = Math.max(0, newPopulation.mood - 12);
            // Reduce natural resource production temporarily
            newNaturalResources.food = Math.floor(newNaturalResources.food * 0.85);
          }
        },
        {
          name: "Forest Fire",
          effects: () => {
            newNaturalResources.wood = Math.floor(newNaturalResources.wood * 0.5);
            newNaturalResources.food = Math.floor(newNaturalResources.food * 0.8);
            newPopulation.mood = Math.max(0, newPopulation.mood - 10);
          }
        }
      ];
      
      const randomDisaster = disasters[Math.floor(Math.random() * disasters.length)];
      randomDisaster.effects();
      
      // Add disaster event to multiplayer feed if in multiplayer
      if (get().gameId) {
        get().addGameEvent({
          type: 'disaster',
          fromUserId: 'system',
          data: {
            disasterType: randomDisaster.name,
            month: newMonth,
            year: newYear
          }
        });
      }
      
      console.log(`🚨 DISASTER: ${randomDisaster.name} has struck your nation!`);
    }
    
    // Economic Cycle Management
    let newEconomicCycle = { ...get().economicCycle };
    
    if (yearChanged) {
      newEconomicCycle.yearsInPhase++;
      
      // Check if we need to trigger a new economic cycle
      if (newYear >= newEconomicCycle.nextCycleYear) {
        const cycles = [
          { phase: 'boom' as const, duration: [2, 4], multiplier: [1.3, 1.6], description: "Economic Boom" },
          { phase: 'bust' as const, duration: [1, 3], multiplier: [0.4, 0.7], description: "Economic Recession" },
          { phase: 'recovery' as const, duration: [2, 3], multiplier: [0.8, 1.1], description: "Economic Recovery" },
          { phase: 'stable' as const, duration: [3, 6], multiplier: [0.9, 1.1], description: "Stable Economy" }
        ];
        
        // Don't repeat the same phase twice in a row
        const availableCycles = cycles.filter(c => c.phase !== newEconomicCycle.phase);
        const newCycle = availableCycles[Math.floor(Math.random() * availableCycles.length)];
        
        const duration = Math.floor(Math.random() * (newCycle.duration[1] - newCycle.duration[0] + 1)) + newCycle.duration[0];
        const multiplier = Math.random() * (newCycle.multiplier[1] - newCycle.multiplier[0]) + newCycle.multiplier[0];
        
        newEconomicCycle = {
          phase: newCycle.phase,
          yearsInPhase: 0,
          nextCycleYear: newYear + duration,
          multiplier: Number(multiplier.toFixed(2))
        };
        
        // Apply economic cycle effects
        if (newCycle.phase === 'boom') {
          newResources.economy = Math.min(100, newResources.economy * 1.2);
          newResources.stability = Math.min(100, newResources.stability * 1.1);
          newPopulation.mood = Math.min(100, newPopulation.mood + 15);
        } else if (newCycle.phase === 'bust') {
          newResources.economy = Math.max(0, newResources.economy * 0.6);
          newResources.stability = Math.max(0, newResources.stability * 0.8);
          newPopulation.mood = Math.max(0, newPopulation.mood - 20);
          // Economic hardship can cause population loss
          const economicMigration = Math.floor(totalPop * 0.05);
          newPopulation.men = Math.max(0, newPopulation.men - Math.floor(economicMigration * 0.4));
          newPopulation.women = Math.max(0, newPopulation.women - Math.floor(economicMigration * 0.4));
          newPopulation.children = Math.max(0, newPopulation.children - Math.floor(economicMigration * 0.2));
        } else if (newCycle.phase === 'recovery') {
          newResources.economy = Math.min(100, newResources.economy * 1.1);
          newPopulation.mood = Math.min(100, newPopulation.mood + 8);
        }
        
        // Add economic cycle event to multiplayer feed
        if (get().gameId) {
          get().addGameEvent({
            type: 'economic_cycle',
            fromUserId: 'system',
            data: {
              cycleType: newCycle.phase,
              description: newCycle.description,
              multiplier: newEconomicCycle.multiplier,
              year: newYear
            }
          });
        }
        
        console.log(`📈 ECONOMIC CYCLE: ${newCycle.description} (${newEconomicCycle.multiplier}x multiplier)`);
      }
    }
    
    // Generate new objectives if year changed
    let newObjectives = yearlyObjectives;
    let canAdvance = canAdvanceYear;
    
    if (yearChanged) {
      newObjectives = generateYearlyObjectives(
        newResources,
        newNaturalResources,
        newPopulation,
        newYear,
        unlockedTechs
      );
      canAdvance = false; // Reset advancement flag for new year
    } else {
      // Update objectives status
      newObjectives = updateObjectivesStatus(
        yearlyObjectives,
        newResources,
        newNaturalResources,
        newPopulation,
        unlockedTechs
      );
      canAdvance = checkObjectivesCompleted(newObjectives);
    }
    
    // DEBT SYSTEM - Compound Interest Mechanics
    let newNationalDebt = { ...get().nationalDebt };
    
    if (newNationalDebt.totalDebt > 0) {
      // Monthly compound interest calculation
      const monthlyInterestRate = newNationalDebt.interestRate / 12;
      const interestAccrued = newNationalDebt.totalDebt * monthlyInterestRate;
      
      newNationalDebt.totalDebt += interestAccrued;
      newNationalDebt.monthlyInterest = interestAccrued;
      
      // Debt payment from economy (automatic deduction)
      const debtPayment = Math.min(newResources.economy * 2, interestAccrued * 1.5); // Can pay up to 1.5x interest
      newNationalDebt.totalDebt = Math.max(0, newNationalDebt.totalDebt - debtPayment);
      newResources.economy = Math.max(0, newResources.economy - debtPayment / 2);
      
      // High debt penalties
      if (newNationalDebt.totalDebt > 1000) {
        newResources.stability = Math.max(0, newResources.stability - 5); // Debt crisis
        newPopulation.mood = Math.max(0, newPopulation.mood - 8); // Austerity measures
        
        if (newNationalDebt.totalDebt > 2000) {
          // Severe debt crisis - economic collapse risk
          newResources.economy = Math.max(0, newResources.economy - 10);
          console.log(`💸 DEBT CRISIS: National debt of ${newNationalDebt.totalDebt.toFixed(0)} is crippling your economy!`);
        }
      }
    }
    
    set({
      year: newYear,
      month: newMonth,
      currentEra: newEra,
      population: newPopulation,
      naturalResources: newNaturalResources,
      resources: newResources,
      yearlyObjectives: newObjectives,
      canAdvanceYear: canAdvance,
      economicCycle: newEconomicCycle,
      nationalDebt: newNationalDebt
    });
  },
  
  setNation: (name: string) => set({ nationName: name }),
  
  setLeader: (name: string) => set({ leaderName: name }),

  setGameId: (id: string | null) => set({ gameId: id }),
  
  setGameState: (newState: Partial<GameState>) => set(newState),

  setDiplomaticStance: (targetUserId: string, stance: 'neutral' | 'alliance' | 'rivalry') => {
    set(state => ({
      diplomaticStances: {
        ...state.diplomaticStances,
        [targetUserId]: stance,
      },
    }));
  },

  setWarOutcome: (attackerId: string, defenderId: string, outcome: 'win' | 'loss' | 'draw', stolenResources: any, attackerCasualties: number, defenderCasualties: number) => {
    set(state => {
      const newResources = { ...state.resources };
      const newNaturalResources = { ...state.naturalResources };
      const newPopulation = { ...state.population };

      // Apply resource changes based on outcome
      if (outcome === 'win') {
        newResources.military = Math.min(100, newResources.military + 5); // Small military boost for win
        newResources.stability = Math.min(100, newResources.stability + 3); // Small stability boost
        // Add stolen resources
        for (const key in stolenResources) {
          newNaturalResources[key as keyof NaturalResources] = Math.max(0, newNaturalResources[key as keyof NaturalResources] + stolenResources[key]);
        }
      } else if (outcome === 'loss') {
        newResources.military = Math.max(0, newResources.military - 5); // Military hit for loss
        newResources.stability = Math.max(0, newResources.stability - 3); // Stability hit
        // Resources are stolen from the loser, so they decrease
        for (const key in stolenResources) {
          newNaturalResources[key as keyof NaturalResources] = Math.max(0, newNaturalResources[key as keyof NaturalResources] - stolenResources[key]);
        }
      }

      // Apply casualties
      newPopulation.soldiers = Math.max(0, newPopulation.soldiers - attackerCasualties);
      // Note: Defender casualties are handled by the Firestore update directly from launchAttackInFirestore

      return {
        resources: newResources,
        naturalResources: newNaturalResources,
        population: newPopulation,
        // Optionally, add war event to activeWars or a separate war history array
      };
    });
  },

  resetGame: () => {
    const initialResources = {
      stability: 10,
      economy: 5,
      military: 3,
      diplomacy: 1,
      culture: 2
    };
    
    const initialNaturalResources = {
      wood: 500,
      minerals: 300,
      food: 400,
      water: 600,
      land: 1000
    };
    
    const initialPopulation = {
      men: 5,
      women: 5,
      children: 0,
      workers: 7,
      soldiers: 0,
      scientists: 0,
      mood: 70,
      monthsPassed: 0
    };
    
    const initialYear = ERAS[0].startYear;
    
    // Generate initial objectives
    const initialObjectives = generateYearlyObjectives(
      initialResources, 
      initialNaturalResources, 
      initialPopulation, 
      initialYear,
      []
    );
    
    set({
      resources: initialResources,
      naturalResources: initialNaturalResources,
      population: initialPopulation,
      currentEra: ERAS[0].name,
      year: initialYear,
      month: 1,
      growthTimers: createInitialGrowthTimers(),
      unlockedTechs: [],
      selectedTech: null,
      lastTechResearched: null,
      yearlyObjectives: initialObjectives,
      canAdvanceYear: false,
      gameStartTime: Date.now(),
      multiplayer: {
        isMultiplayer: false,
        isHost: false,
        players: {},
        turnInfo: {
          currentPlayer: '',
          turnNumber: 1,
          actionsTaken: []
        },
        gameEvents: [],
        pendingActions: [],
        syncStatus: 'synced'
      }
    });
  },

  // Multiplayer actions
  initializeMultiplayer: (gameId: string, isHost: boolean, players: Record<string, any>) => {
    set(state => ({
      gameId,
      multiplayer: {
        ...state.multiplayer,
        isMultiplayer: true,
        isHost,
        players,
        turnInfo: {
          currentPlayer: isHost ? Object.keys(players)[0] : state.multiplayer.turnInfo.currentPlayer,
          turnNumber: 1,
          actionsTaken: []
        }
      }
    }));
  },

  updatePlayerStatus: (userId: string, isOnline: boolean) => {
    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        players: {
          ...state.multiplayer.players,
          [userId]: {
            ...state.multiplayer.players[userId],
            isOnline,
            lastSeen: Date.now()
          }
        }
      }
    }));
  },

  addGameEvent: (event: Omit<GameEvent, 'id' | 'timestamp' | 'read'>) => {
    const newEvent: GameEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false
    };

    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        gameEvents: [...state.multiplayer.gameEvents, newEvent]
      }
    }));
  },

  markEventAsRead: (eventId: string) => {
    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        gameEvents: state.multiplayer.gameEvents.map(event =>
          event.id === eventId ? { ...event, read: true } : event
        )
      }
    }));
  },

  endTurn: () => {
    const { multiplayer } = get();
    const playerIds = Object.keys(multiplayer.players);
    const currentIndex = playerIds.indexOf(multiplayer.turnInfo.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextPlayer = playerIds[nextIndex];
    
    // Add turn end event
    get().addGameEvent({
      type: 'turn_ended',
      fromUserId: multiplayer.turnInfo.currentPlayer,
      data: {
        turnNumber: multiplayer.turnInfo.turnNumber,
        actionsTaken: multiplayer.turnInfo.actionsTaken
      }
    });

    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        turnInfo: {
          currentPlayer: nextPlayer,
          turnNumber: nextIndex === 0 ? state.multiplayer.turnInfo.turnNumber + 1 : state.multiplayer.turnInfo.turnNumber,
          actionsTaken: []
        }
      }
    }));
  },

  setCurrentPlayer: (playerId: string) => {
    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        turnInfo: {
          ...state.multiplayer.turnInfo,
          currentPlayer: playerId
        }
      }
    }));
  },

  syncGameState: (remoteState: Partial<GameState>) => {
    set(state => {
      // Merge remote state with local state, prioritizing remote for multiplayer games
      const mergedState = { ...state };
      
      if (remoteState.resources) {
        mergedState.resources = { ...state.resources, ...remoteState.resources };
      }
      
      if (remoteState.naturalResources) {
        mergedState.naturalResources = { ...state.naturalResources, ...remoteState.naturalResources };
      }
      
      if (remoteState.population) {
        mergedState.population = { ...state.population, ...remoteState.population };
      }
      
      if (remoteState.unlockedTechs) {
        mergedState.unlockedTechs = remoteState.unlockedTechs;
      }
      
      if (remoteState.year !== undefined) {
        mergedState.year = remoteState.year;
      }
      
      if (remoteState.month !== undefined) {
        mergedState.month = remoteState.month;
      }
      
      if (remoteState.currentEra) {
        mergedState.currentEra = remoteState.currentEra;
      }
      
      if (remoteState.diplomaticStances) {
        mergedState.diplomaticStances = { ...state.diplomaticStances, ...remoteState.diplomaticStances };
      }
      
      if (remoteState.activeWars) {
        mergedState.activeWars = remoteState.activeWars;
      }

      return mergedState;
    });
  },

  queueAction: (action: any) => {
    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        pendingActions: [...state.multiplayer.pendingActions, {
          ...action,
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }]
      }
    }));
  },

  processQueuedActions: () => {
    const { multiplayer } = get();
    
    // Process each queued action
    multiplayer.pendingActions.forEach(action => {
      switch (action.type) {
        case 'tech_research':
          get().selectTech(action.techId);
          break;
        case 'resource_investment':
          get().investInResource(action.resourceKey);
          break;
        case 'population_distribution':
          get().distributePeople(action.role, action.amount);
          break;
        case 'month_advance':
          get().advanceMonth();
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
    });

    // Clear processed actions
    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        pendingActions: []
      }
    }));
  },

  setSyncStatus: (status: 'synced' | 'syncing' | 'error') => {
    set(state => ({
      multiplayer: {
        ...state.multiplayer,
        syncStatus: status
      }
    }));
  }
})); 