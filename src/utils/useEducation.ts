import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export type EducationTier = {
  name: string;
  min: number;
  max: number;
  color: string;
  benefits: string;
};

export function useEducation() {
  const { resources, population, unlockedTechs } = useGameStore();
  const [educationLevel, setEducationLevel] = useState(10);
  
  // Education tiers and their benefits
  const educationTiers: EducationTier[] = [
    { name: "Rudimentary", min: 0, max: 20, color: "bg-red-500", benefits: "Basic literacy and numeracy" },
    { name: "Basic", min: 21, max: 40, color: "bg-orange-500", benefits: "Primary education for most citizens" },
    { name: "Developing", min: 41, max: 60, color: "bg-yellow-500", benefits: "Secondary education becoming common" },
    { name: "Advanced", min: 61, max: 80, color: "bg-blue-500", benefits: "Higher education and specialized training" },
    { name: "Excellent", min: 81, max: 100, color: "bg-green-500", benefits: "World-class research and universal education" }
  ];
  
  // Calculate current education level based on culture resource and techs
  useEffect(() => {
    // Base education level is 10
    let baseLevel = 10;
    
    // Add 1 point per 10 culture points
    baseLevel += Math.floor(resources.culture / 10);
    
    // Add bonus for scientists
    baseLevel += Math.floor(population.scientists / 2);
    
    // Check for education technologies that give bonuses
    const hasPublicEducation = unlockedTechs.includes('cul_public_education');
    const hasHigherEducation = unlockedTechs.includes('cul_higher_education');
    
    if (hasPublicEducation) baseLevel += 10;
    if (hasHigherEducation) baseLevel += 15;
    
    // Cap at 100
    setEducationLevel(Math.min(100, baseLevel));
  }, [resources.culture, population.scientists, unlockedTechs]);
  
  // Get current education tier
  const getCurrentTier = (): EducationTier => {
    return educationTiers.find(tier => 
      educationLevel >= tier.min && educationLevel <= tier.max
    ) || educationTiers[0];
  };
  
  // Calculate productivity bonus from education
  const getProductivityBonus = (): number => {
    // Each point of education gives 0.5% productivity
    return educationLevel * 0.5;
  };
  
  // Calculate research bonus from education
  const getResearchBonus = (): number => {
    return Math.floor(educationLevel / 10);
  };
  
  // Calculate mood bonus from education level
  const getMoodBonus = (): number => {
    // Higher education means more content population
    if (educationLevel >= 80) return 10;
    if (educationLevel >= 60) return 7;
    if (educationLevel >= 40) return 5;
    if (educationLevel >= 20) return 2;
    return 0;
  };
  
  return {
    educationLevel,
    educationTiers,
    currentTier: getCurrentTier(),
    productivityBonus: getProductivityBonus(),
    researchBonus: getResearchBonus(),
    moodBonus: getMoodBonus()
  };
} 