import { useGameStore } from '../store/gameStore';

export default function YearlyObjectives() {
  const { yearlyObjectives, canAdvanceYear, year, month } = useGameStore();
  
  return (
    <div className="p-4 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-md text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Yearly Objectives</h3>
        <div className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-200">
          <span className="font-medium">{getMonthName(month)} {year}</span>
        </div>
      </div>
      
      {/* Year Advancement Status */}
      <div className={`mb-4 p-4 rounded-lg ${canAdvanceYear 
        ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700' 
        : 'bg-gradient-to-r from-amber-900/50 to-yellow-900/50 border border-amber-700'}`}>
        <div className="flex items-center">
          {canAdvanceYear ? (
            <>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-900/70 text-green-400 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-green-400">All objectives completed!</p>
                <p className="text-sm text-green-500">Your nation can advance to the next year in December.</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-900/70 text-amber-400 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-400">Objectives In Progress</p>
                <p className="text-sm text-amber-500">Complete all objectives to advance to the next year.</p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Objectives List */}
      <div className="space-y-3">
        {yearlyObjectives.map((objective, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border transition-all duration-200 ${
              objective.completed 
                ? 'bg-gradient-to-r from-green-900/40 to-green-800/30 border-green-700' 
                : 'bg-gray-800/70 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex justify-between mb-2">
              <span className="font-medium text-gray-200">{objective.description}</span>
              {objective.completed ? (
                <span className="text-green-500 text-sm font-medium px-2 py-1 bg-green-900/60 rounded-full">
                  Completed
                </span>
              ) : (
                <span className="text-blue-400 text-sm px-2 py-1 bg-blue-900/50 rounded-full">
                  In Progress
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2 overflow-hidden">
              {renderProgressBar(objective)}
            </div>
          </div>
        ))}
      </div>
      
      {yearlyObjectives.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <div className="w-12 h-12 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-3"></div>
          <p>Loading objectives...</p>
        </div>
      )}
    </div>
  );
}

// Helper to render the progress bar based on objective type
function renderProgressBar(objective: any) {
  const { type, target, amount, completed } = objective;
  
  // If completed, show full bar
  if (completed) {
    return <div className="h-2.5 rounded-full bg-green-500 transition-all duration-700 w-full"></div>;
  }
  
  // Otherwise show partial based on store values
  const { resources, naturalResources, population, unlockedTechs } = useGameStore.getState();
  
  let currentValue = 0;
  
  switch (type) {
    case 'resources':
      currentValue = resources[target as keyof typeof resources];
      break;
    case 'naturalResources':
      currentValue = naturalResources[target as keyof typeof naturalResources];
      break;
    case 'population':
      if (target === 'total') {
        currentValue = population.men + population.women + population.children;
      } else if (target === 'mood') {
        currentValue = population.mood;
      }
      break;
    case 'tech':
      currentValue = unlockedTechs.length;
      break;
  }
  
  // Calculate percentage (cap at 100%)
  const percentage = Math.min(100, (currentValue / amount) * 100);
  
  // Choose color based on completion percentage
  let color = 'bg-blue-500';
  if (percentage >= 90) color = 'bg-green-400';
  else if (percentage >= 60) color = 'bg-blue-500';
  else if (percentage >= 30) color = 'bg-amber-500';
  else color = 'bg-red-500';
  
  return (
    <div 
      className={`h-2.5 rounded-full ${color} transition-all duration-700`} 
      style={{ width: `${percentage}%` }}
    ></div>
  );
}

// Helper to get month name
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
} 