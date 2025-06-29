import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const InsuranceSystem: React.FC = () => {
  const { 
    resources, 
    insurancePolicies, 
    insuranceCompany, 
    purchaseInsurance, 
    cancelInsurance 
  } = useGameStore();

  const [selectedType, setSelectedType] = useState<'disaster' | 'economic' | 'health' | 'agricultural'>('disaster');
  const [coverageLevel, setCoverageLevel] = useState(75);

  const policyTemplates = {
    disaster: {
      name: 'Natural Disaster Protection',
      description: 'Covers earthquakes, floods, forest fires, and other natural disasters',
      icon: '🌪️'
    },
    economic: {
      name: 'Economic Crisis Insurance',
      description: 'Protects against economic recessions and market crashes',
      icon: '📉'
    },
    health: {
      name: 'Public Health Emergency Coverage',
      description: 'Coverage for disease outbreaks and health crises',
      icon: '🏥'
    },
    agricultural: {
      name: 'Agricultural Loss Protection',
      description: 'Covers crop failures, droughts, and food production losses',
      icon: '🌾'
    }
  };

  const calculateCost = (type: keyof typeof policyTemplates, coverage: number) => {
    const baseCosts = {
      disaster: 200,
      economic: 300,
      health: 250,
      agricultural: 150
    };
    const basePremiums = {
      disaster: 15,
      economic: 20,
      health: 18,
      agricultural: 12
    };
    
    const costMultiplier = coverage / 50;
    return {
      initialCost: Math.floor(baseCosts[type] * costMultiplier),
      monthlyPremium: Math.floor(basePremiums[type] * costMultiplier)
    };
  };

  const { initialCost, monthlyPremium } = calculateCost(selectedType, coverageLevel);
  const canAfford = resources.economy >= initialCost / 10;
  const hasExisting = insurancePolicies.some(p => p.type === selectedType && p.active);

  const handlePurchase = () => {
    if (canAfford && !hasExisting) {
      purchaseInsurance(selectedType, coverageLevel);
    }
  };

  const activePolicies = insurancePolicies.filter(p => p.active);
  const totalMonthlyPremiums = activePolicies.reduce((sum, policy) => sum + policy.premium, 0);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🛡️</span>
        <h2 className="text-2xl font-bold text-gray-800">National Insurance System</h2>
      </div>

      {/* Insurance Company Status */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Insurance Company Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-600 font-medium">Reserves:</span>
            <div className="text-lg font-bold">{insuranceCompany.reserves.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Monthly Income:</span>
            <div className="text-lg font-bold">{insuranceCompany.monthlyPremiumIncome.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Claims Paid:</span>
            <div className="text-lg font-bold">{insuranceCompany.totalClaimsPaid.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Risk Level:</span>
            <div className={`text-lg font-bold ${getRiskColor(insuranceCompany.riskAssessment)}`}>
              {insuranceCompany.riskAssessment.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase New Policy */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Purchase Insurance Policy</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Policy Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(policyTemplates).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.icon} {template.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-1">
              {policyTemplates[selectedType].description}
            </p>
          </div>

          {/* Coverage Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coverage Level: {coverageLevel}%
            </label>
            <input
              type="range"
              min="25"
              max="100"
              step="25"
              value={coverageLevel}
              onChange={(e) => setCoverageLevel(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="mt-4 p-3 bg-white rounded border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Initial Cost:</span>
            <span className="font-semibold">{(initialCost / 10).toFixed(1)} Economy Points</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Monthly Premium:</span>
            <span className="font-semibold">{(monthlyPremium / 10).toFixed(1)} Economy Points</span>
          </div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={!canAfford || hasExisting}
          className={`w-full mt-4 py-2 px-4 rounded-md font-medium ${
            canAfford && !hasExisting
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasExisting 
            ? `Already have ${policyTemplates[selectedType].name}`
            : !canAfford 
              ? 'Insufficient Economy Points'
              : `Purchase Policy`
          }
        </button>
      </div>

      {/* Active Policies */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Active Policies ({activePolicies.length})
        </h3>
        
        {activePolicies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">📋</span>
            <p>No active insurance policies</p>
            <p className="text-sm">Purchase a policy to protect against crises</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {activePolicies.map((policy) => (
                <div key={policy.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{policyTemplates[policy.type].icon}</span>
                        <h4 className="font-semibold text-gray-800">{policy.name}</h4>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Coverage: {policy.coverage}% • Premium: {policy.premium}/month</div>
                        <div>Claims Used: {policy.claimsUsed}/{policy.maxClaims}</div>
                        <div>Active since: {policy.purchaseYear}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelInsurance(policy.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Claims Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Claims Used</span>
                      <span>{policy.claimsUsed}/{policy.maxClaims}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          policy.claimsUsed >= policy.maxClaims 
                            ? 'bg-red-500' 
                            : policy.claimsUsed > policy.maxClaims * 0.7 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${(policy.claimsUsed / policy.maxClaims) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total Cost Summary */}
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-800">
                  Total Monthly Insurance Cost:
                </span>
                <span className="text-lg font-bold text-yellow-900">
                  {(totalMonthlyPremiums / 10).toFixed(1)} Economy Points
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Automatically deducted each month
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InsuranceSystem;