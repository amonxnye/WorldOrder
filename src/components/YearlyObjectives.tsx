import { useGameStore } from '../store/gameStore';

export default function YearlyObjectives() {
  const { yearlyObjectives, canAdvanceYear, year, month } = useGameStore();
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Yearly Objectives</h3>
        <div className="text-sm">
          <span className="font-medium">Current Date:</span> 
          <span className="ml-1">{getMonthName(month)} {year}</span>
        </div>
      </div>
      
      {/* Year Advancement Status */}
      <div className={`mb-4 p-3 rounded-lg ${canAdvanceYear ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center">
          {canAdvanceYear ? (
            <>
              <span className="text-green-600 text-xl mr-2">✓</span>
              <div>
                <p className="font-medium text-green-700">All objectives completed!</p>
                <p className="text-sm text-green-600">Your nation can advance to the next year in December.</p>
              </div>
            </>
          ) : (
            <>
              <span className="text-amber-600 text-xl mr-2">!</span>
              <div>
                <p className="font-medium text-amber-700">Objectives In Progress</p>
                <p className="text-sm text-amber-600">Complete all objectives to advance to the next year.</p>
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
            className={`p-3 rounded-lg border ${
              objective.completed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex justify-between mb-1">
              <span className="font-medium">{objective.description}</span>
              {objective.completed ? (
                <span className="text-green-600 text-sm font-medium">Completed</span>
              ) : (
                <span className="text-gray-500 text-sm">In Progress</span>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              {renderProgressBar(objective)}
            </div>
          </div>
        ))}
      </div>
      
      {yearlyObjectives.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          Loading objectives...
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
    return <div className="h-2 rounded-full bg-green-500 w-full"></div>;
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
  
  return (
    <div 
      className="h-2 rounded-full bg-blue-500 transition-all duration-500" 
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