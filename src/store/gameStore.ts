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
  stability: 0.05,   // 5% base growth
  economy: 0.07,     // 7% base growth
  military: 0.03,    // 3% base growth
  diplomacy: 0.04,   // 4% base growth
  culture: 0.06      // 6% base growth
};

// Maximum growth percentage (10%)
const MAX_GROWTH_PERCENTAGE = 0.1;

// Resource growth interval in ms (15 seconds)
const GROWTH_INTERVAL = 15000;

// Population constants
const MONTHLY_GROWTH_RATE = 0.1; // 10% monthly growth
const ANNUAL_LOSS_RATE = 0.05;   // 5% annual population loss
const FOOD_PER_PERSON = 2;       // Food consumed per person per month

// Game state interface
interface GameState {
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
  
  // Actions
  selectTech: (techId: string) => void;
  advanceMonth: () => void;
  investInResource: (resourceKey: keyof Resources) => void;
  distributePeople: (role: 'workers' | 'soldiers' | 'scientists', amount: number) => void;
  setNation: (name: string) => void;
  setLeader: (name: string) => void;
  resetGame: () => void;
  
  // Growth actions
  triggerGrowth: (key: keyof Resources, manual?: boolean) => void;
  checkAutoGrowth: () => void;
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
const calculateInvestmentCost = (resourceKey: keyof Resources): Partial<NaturalResources> => {
  // Different resources require different natural resources
  const costsByResource: Record<keyof Resources, Partial<NaturalResources>> = {
    stability: { food: -10, minerals: -5 },
    economy: { wood: -15, minerals: -10, land: -5 },
    military: { minerals: -20, food: -10 },
    diplomacy: { food: -5, water: -10 },
    culture: { wood: -10, water: -5 }
  };
  
  return costsByResource[resourceKey] || {};
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
const calculateGrowthModifiers = (unlockedTechs: string[]): Record<keyof Resources, number> => {
  const modifiers: Record<keyof Resources, number> = {
    stability: 1,
    economy: 1,
    military: 1,
    diplomacy: 1,
    culture: 1
  };
  
  // Apply modifiers based on unlocked technologies
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
  
  // Ensure no negative growth modifiers
  Object.keys(modifiers).forEach(key => {
    modifiers[key as keyof Resources] = Math.max(0.1, modifiers[key as keyof Resources]);
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
  resources: {
    stability: 10,
    economy: 5,
    military: 3,
    diplomacy: 1,
    culture: 2
  },
  naturalResources: {
    wood: 500,
    minerals: 300,
    food: 400,
    water: 600,
    land: 1000
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
    const { resources, naturalResources, unlockedTechs, population, yearlyObjectives } = get();
    
    // Calculate growth modifiers based on unlocked techs
    const growthModifiers = calculateGrowthModifiers(unlockedTechs);
    
    // Calculate growth amount (base rate * modifier, but cap at MAX_GROWTH_PERCENTAGE)
    const baseGrowthRate = 0.05; // 5% base growth rate for investments
    const modifiedRate = baseGrowthRate * growthModifiers[resourceKey];
    const actualRate = Math.min(modifiedRate, MAX_GROWTH_PERCENTAGE);
    
    // Calculate natural resource costs
    const investmentCosts = calculateInvestmentCost(resourceKey);
    
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
    newPopulation.mood = Math.min(100, newPopulation.mood + 2); // Slight mood boost for any investment
    
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
    
    set({
      year: newYear,
      month: newMonth,
      currentEra: newEra,
      population: newPopulation,
      naturalResources: newNaturalResources,
      resources: newResources,
      yearlyObjectives: newObjectives,
      canAdvanceYear: canAdvance
    });
  },
  
  setNation: (name: string) => set({ nationName: name }),
  
  setLeader: (name: string) => set({ leaderName: name }),
  
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
      gameStartTime: Date.now()
    });
  }
})); 