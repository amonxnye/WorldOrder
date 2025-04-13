import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

type Loan = {
  id: string;
  resourceType: string;
  amount: number;
  interestRate: number;
  monthsRemaining: number;
  monthlyPayment: number;
};

type Investment = {
  id: string;
  resourceType: string;
  amount: number;
  returnRate: number;
  monthsRemaining: number;
  riskLevel: 'low' | 'medium' | 'high';
};

export default function BankingSystem() {
  const { resources, naturalResources, investInResource } = useGameStore();
  const [activeTab, setActiveTab] = useState<'loans' | 'investments' | 'policies'>('loans');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [economicPolicy, setEconomicPolicy] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  
  // Demo loans data
  const [availableLoans, setAvailableLoans] = useState([
    { resourceType: 'wood', maxAmount: 500, interestRate: 0.05 },
    { resourceType: 'minerals', maxAmount: 300, interestRate: 0.07 },
    { resourceType: 'food', maxAmount: 400, interestRate: 0.04 },
    { resourceType: 'water', maxAmount: 300, interestRate: 0.03 },
  ]);
  
  // Demo investment options
  const investmentOptions = [
    { name: 'Conservative Fund', returnRate: 0.03, riskLevel: 'low' as const, minAmount: 50 },
    { name: 'Balanced Fund', returnRate: 0.07, riskLevel: 'medium' as const, minAmount: 100 },
    { name: 'Growth Fund', returnRate: 0.12, riskLevel: 'high' as const, minAmount: 200 },
  ];
  
  // Policy effects
  const policyEffects = {
    conservative: { loanRate: -0.01, investmentReturn: -0.02, stability: 10 },
    balanced: { loanRate: 0, investmentReturn: 0, stability: 5 },
    aggressive: { loanRate: 0.02, investmentReturn: 0.04, stability: -5 },
  };
  
  // Get the current interest rate based on economic policy
  const getCurrentRate = (baseRate: number) => {
    return baseRate + policyEffects[economicPolicy].loanRate;
  };
  
  // Calculate loan parameters
  const calculateLoan = (principal: number, interestRate: number, months: number) => {
    const monthlyRate = interestRate / 12;
    const monthlyPayment = principal * monthlyRate * (Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return {
      totalPayment: monthlyPayment * months,
      monthlyPayment
    };
  };
  
  // Take out a new loan
  const takeLoan = (resourceType: string, amount: number, interestRate: number) => {
    // Default 12 month loan term
    const months = 12;
    const { monthlyPayment } = calculateLoan(amount, interestRate, months);
    
    const newLoan: Loan = {
      id: Date.now().toString(),
      resourceType,
      amount,
      interestRate,
      monthsRemaining: months,
      monthlyPayment
    };
    
    setLoans([...loans, newLoan]);
    // In a real implementation, would need to add the resources to the player's stockpile
    // and set up monthly repayments
  };
  
  // Make an investment
  const makeInvestment = (resourceType: string, amount: number, returnRate: number, riskLevel: 'low' | 'medium' | 'high') => {
    // Default 24 month investment term
    const months = 24;
    
    const newInvestment: Investment = {
      id: Date.now().toString(),
      resourceType,
      amount,
      returnRate: returnRate + policyEffects[economicPolicy].investmentReturn,
      monthsRemaining: months,
      riskLevel
    };
    
    setInvestments([...investments, newInvestment]);
    // In a real implementation, would need to subtract the resources from the player's stockpile
  };
  
  // Handle loan repayment
  const repayLoan = (id: string) => {
    setLoans(loans.filter(loan => loan.id !== id));
    // In a real implementation, would need to subtract the repayment amount
    // from the player's resources
  };
  
  // Calculate total debt
  const totalDebt = loans.reduce((sum, loan) => sum + (loan.monthlyPayment * loan.monthsRemaining), 0);
  
  // Calculate total investments value
  const totalInvestments = investments.reduce((sum, investment) => {
    const expectedReturn = investment.amount * (1 + investment.returnRate * (investment.monthsRemaining / 12));
    return sum + expectedReturn;
  }, 0);
  
  // Change economic policy
  const changePolicy = (policy: 'conservative' | 'balanced' | 'aggressive') => {
    setEconomicPolicy(policy);
    // Apply policy effects to current loans and investments
    setLoans(loans.map(loan => ({
      ...loan,
      interestRate: loan.interestRate + policyEffects[policy].loanRate
    })));
    
    setInvestments(investments.map(investment => ({
      ...investment,
      returnRate: investment.returnRate + policyEffects[policy].investmentReturn
    })));
  };
  
  return (
    <div className="game-card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold neon-text">Central Bank</h3>
        <div className="text-sm bg-gray-800 px-2 py-1 rounded">
          Balance: <span className="font-bold">{Math.floor(resources.economy * 10)}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-700">
        <button 
          className={`px-4 py-2 ${activeTab === 'loans' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('loans')}
        >
          Loans
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'investments' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('investments')}
        >
          Investments
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'policies' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('policies')}
        >
          Policies
        </button>
      </div>
      
      {/* Finance Summary */}
      <div className="mb-4 p-3 glass-container">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-sm text-gray-400">Total Debt</h4>
            <p className={`text-lg font-bold ${totalDebt > 0 ? 'text-red-400' : 'text-gray-200'}`}>
              {totalDebt.toFixed(0)}
            </p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400">Investments Value</h4>
            <p className="text-lg font-bold text-green-400">{totalInvestments.toFixed(0)}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400">Policy</h4>
            <p className="text-lg font-bold">{economicPolicy}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400">Credit Rating</h4>
            <p className="text-lg font-bold text-blue-400">
              {resources.economy > 70 ? 'AAA' : resources.economy > 50 ? 'AA' : resources.economy > 30 ? 'B' : 'C'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div>
          <h4 className="font-medium mb-2">Available Loans</h4>
          <div className="space-y-3 mb-4">
            {availableLoans.map((loan, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="capitalize font-medium">{loan.resourceType}</span>
                  <span className="text-green-400">{loan.maxAmount} units</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Interest: {(getCurrentRate(loan.interestRate) * 100).toFixed(1)}%</span>
                  <span>12 month term</span>
                </div>
                <button 
                  className="mt-2 w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  onClick={() => takeLoan(loan.resourceType, loan.maxAmount, getCurrentRate(loan.interestRate))}
                >
                  Take Loan
                </button>
              </div>
            ))}
          </div>
          
          <h4 className="font-medium mb-2">Current Loans</h4>
          {loans.length > 0 ? (
            <div className="space-y-3">
              {loans.map(loan => (
                <div key={loan.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="capitalize font-medium">{loan.resourceType} Loan</span>
                    <span className="text-red-400">{loan.amount} units</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Rate: {(loan.interestRate * 100).toFixed(1)}%</span>
                    <span>Months left: {loan.monthsRemaining}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Monthly payment: {loan.monthlyPayment.toFixed(1)}</span>
                    <button 
                      className="text-red-400 hover:text-red-300"
                      onClick={() => repayLoan(loan.id)}
                    >
                      Repay Early
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">You have no active loans</div>
          )}
        </div>
      )}
      
      {/* Investments Tab */}
      {activeTab === 'investments' && (
        <div>
          <h4 className="font-medium mb-2">Investment Options</h4>
          <div className="space-y-3 mb-4">
            {investmentOptions.map((option, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                option.riskLevel === 'low' ? 'bg-blue-900/30' : 
                option.riskLevel === 'medium' ? 'bg-purple-900/30' : 'bg-red-900/30'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{option.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    option.riskLevel === 'low' ? 'bg-blue-800 text-blue-200' : 
                    option.riskLevel === 'medium' ? 'bg-purple-800 text-purple-200' : 'bg-red-800 text-red-200'
                  }`}>
                    {option.riskLevel} risk
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Expected Return: {((option.returnRate + policyEffects[economicPolicy].investmentReturn) * 100).toFixed(1)}%</span>
                  <span>Minimum: {option.minAmount}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['wood', 'minerals', 'food', 'water'].map(resource => (
                    <button 
                      key={resource}
                      className="py-1 px-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      onClick={() => makeInvestment(resource, option.minAmount, option.returnRate, option.riskLevel)}
                    >
                      Invest {resource}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <h4 className="font-medium mb-2">Current Investments</h4>
          {investments.length > 0 ? (
            <div className="space-y-3">
              {investments.map(investment => (
                <div key={investment.id} className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="capitalize font-medium">{investment.resourceType} Investment</span>
                    <span className="text-green-400">{investment.amount} units</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Return: {(investment.returnRate * 100).toFixed(1)}%</span>
                    <span>Months left: {investment.monthsRemaining}</span>
                  </div>
                  <div className="text-sm mt-1">
                    <span>Expected return: {(investment.amount * (1 + investment.returnRate * (investment.monthsRemaining / 12))).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">You have no active investments</div>
          )}
        </div>
      )}
      
      {/* Economic Policies Tab */}
      {activeTab === 'policies' && (
        <div>
          <h4 className="font-medium mb-2">Economic Policy</h4>
          <div className="space-y-3">
            {['conservative', 'balanced', 'aggressive'].map((policy) => (
              <div 
                key={policy} 
                className={`p-3 rounded-lg cursor-pointer ${
                  economicPolicy === policy ? 'border border-blue-500 bg-blue-900/20' : 'bg-gray-800'
                }`}
                onClick={() => changePolicy(policy as any)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="capitalize font-medium">{policy}</span>
                  {economicPolicy === policy && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Active</span>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Loan Interest:</span>
                    <span className={policyEffects[policy as keyof typeof policyEffects].loanRate < 0 ? 'text-green-400' : 'text-red-400'}>
                      {policyEffects[policy as keyof typeof policyEffects].loanRate > 0 ? '+' : ''}
                      {(policyEffects[policy as keyof typeof policyEffects].loanRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investment Returns:</span>
                    <span className={policyEffects[policy as keyof typeof policyEffects].investmentReturn > 0 ? 'text-green-400' : 'text-red-400'}>
                      {policyEffects[policy as keyof typeof policyEffects].investmentReturn > 0 ? '+' : ''}
                      {(policyEffects[policy as keyof typeof policyEffects].investmentReturn * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stability Effect:</span>
                    <span className={policyEffects[policy as keyof typeof policyEffects].stability > 0 ? 'text-green-400' : 'text-red-400'}>
                      {policyEffects[policy as keyof typeof policyEffects].stability > 0 ? '+' : ''}
                      {policyEffects[policy as keyof typeof policyEffects].stability}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 glass-container">
            <h4 className="text-sm font-medium mb-2">Policy Information</h4>
            <p className="text-sm text-gray-300">
              Your economic policy affects interest rates on loans, returns on investments, and overall stability.
              Conservative policies favor stability at the cost of growth, while aggressive policies maximize growth
              but may lead to instability.
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-400">
        <p>Banking system is tied to your economy resource. Higher economy levels will improve your credit rating and available loan amounts.</p>
      </div>
    </div>
  );
} 