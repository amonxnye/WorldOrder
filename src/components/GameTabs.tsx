import React, { useState } from 'react';
import TechTree from './TechTree';
import ResourceDisplay from './ResourceDisplay';
import NaturalResourceDisplay from './NaturalResourceDisplay';
import PopulationManager from './PopulationManager';
import YearlyObjectives from './YearlyObjectives';
import BankingSystem from './BankingSystem';
import EducationSystem from './EducationSystem';
import BabylonGlobe from './BabylonGlobe';
import DiplomacyDashboard from './DiplomacyDashboard';
import { useGameStore } from '../store/gameStore';

type TabId = 'overview' | 'research' | 'diplomacy' | 'world';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const GameTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { gameId } = useGameStore();

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '🏛️',
      description: 'Nation management and resources'
    },
    {
      id: 'research',
      label: 'Research',
      icon: '🔬',
      description: 'Technology development'
    },
    {
      id: 'diplomacy',
      label: 'Diplomacy',
      icon: '🤝',
      description: 'International relations'
    },
    {
      id: 'world',
      label: 'World',
      icon: '🌍',
      description: 'Global view and objectives'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-6">
              <ResourceDisplay />
              <NaturalResourceDisplay />
            </div>
            <div className="space-y-6">
              <PopulationManager />
              <BankingSystem />
            </div>
            <div className="space-y-6">
              <EducationSystem />
            </div>
          </div>
        );

      case 'research':
        return (
          <div className="h-full">
            <div className="game-card h-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white neon-text">Technology Tree</h2>
                  <p className="text-gray-400 text-sm">Research technologies to advance your civilization</p>
                </div>
              </div>
              <div className="h-[calc(100%-5rem)] overflow-auto">
                <TechTree />
              </div>
            </div>
          </div>
        );

      case 'diplomacy':
        return (
          <div className="h-full">
            {gameId ? (
              <DiplomacyDashboard />
            ) : (
              <div className="game-card p-8 text-center">
                <div className="text-6xl mb-4">🤝</div>
                <h2 className="text-2xl font-bold text-white mb-4">Diplomacy Unavailable</h2>
                <p className="text-gray-400 mb-6">
                  Diplomatic features are only available in multiplayer games.
                </p>
                <p className="text-sm text-gray-500">
                  Join or create a multiplayer game to engage with other nations.
                </p>
              </div>
            )}
          </div>
        );

      case 'world':
        return (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <div className="game-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4 neon-text">World Map</h3>
              <div className="h-96 bg-gray-800/50 rounded-lg overflow-hidden">
                <BabylonGlobe />
              </div>
            </div>
            <div className="space-y-6">
              <div className="game-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Global Statistics</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>World Population:</span>
                    <span className="text-white">8.1B</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Nations:</span>
                    <span className="text-white">195</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Global GDP:</span>
                    <span className="text-white">$104T</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Technology Level:</span>
                    <span className="text-white">Information Age</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Yearly Objectives - Always Visible */}
      <div className="mb-4">
        <YearlyObjectives />
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-6 py-4 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500 bg-blue-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400">
                      {tab.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GameTabs;