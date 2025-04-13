import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import countries from '../data/countries';

interface NationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NationSetupModal({ isOpen, onClose }: NationSetupModalProps) {
  const { nationName, leaderName, setNation, setLeader } = useGameStore();
  const [selectedNation, setSelectedNation] = useState(nationName || '');
  const [inputLeaderName, setInputLeaderName] = useState(leaderName || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [step, setStep] = useState<'nation' | 'leader'>('nation');
  const [error, setError] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<typeof countries[0] | null>(null);

  useEffect(() => {
    if (nationName && !selectedNation) {
      setSelectedNation(nationName);
      // Find the country object if it exists
      const country = countries.find(c => c.name === nationName);
      if (country) {
        setSelectedCountry(country);
      }
    }
    if (leaderName && !inputLeaderName) {
      setInputLeaderName(leaderName);
    }
  }, [nationName, leaderName, selectedNation, inputLeaderName]);

  // Filter countries based on search term and region
  const filteredCountries = countries.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'All' || country.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  // Group countries by region for easier selection
  const groupedCountries = filteredCountries.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = [];
    }
    acc[country.region].push(country);
    return acc;
  }, {} as Record<string, typeof countries>);

  // Get all available regions
  const regions = ['All', ...new Set(countries.map(country => country.region))];

  const handleSelectCountry = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setSelectedNation(country.name);
    setError('');
  };

  const handleCompleteNationSelection = () => {
    if (!selectedCountry) {
      setError('Please select a nation to lead');
      return;
    }
    setStep('leader');
  };

  const handleCompleteSetup = () => {
    if (!inputLeaderName.trim()) {
      setError('Please enter your leader name');
      return;
    }

    if (selectedCountry) {
      setNation(selectedCountry.name);
      setLeader(inputLeaderName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-700 p-4">
          <h2 className="text-2xl font-bold text-white">
            {step === 'nation' ? 'Choose Your Nation' : 'Name Your Leader'}
          </h2>
          <div className="flex items-center gap-2">
            {step === 'leader' && (
              <button
                onClick={() => setStep('nation')}
                className="text-gray-300 hover:text-white px-3 py-1 rounded-md text-sm"
              >
                Back
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/60 border-l-4 border-red-600 p-3 m-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="p-4 overflow-auto max-h-[calc(90vh-4rem)]">
          {step === 'nation' ? (
            <div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2 text-sm">Search for a country:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type to search..."
                    className="bg-gray-800 text-white p-2 rounded-md border border-gray-700 flex-grow"
                  />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="bg-gray-800 text-white p-2 rounded-md border border-gray-700"
                  >
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCountry && (
                <div className="mb-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700 flex items-center">
                  <div className="text-4xl mr-4">{selectedCountry.flag}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedCountry.name}</h3>
                    <p className="text-gray-300 text-sm">{selectedCountry.region}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="text-sm text-blue-300">
                        <span className="font-medium">Stability:</span> {selectedCountry.startingResources?.stability || '?'}
                      </div>
                      <div className="text-sm text-green-300">
                        <span className="font-medium">Economy:</span> {selectedCountry.startingResources?.economy || '?'}
                      </div>
                      <div className="text-sm text-red-300">
                        <span className="font-medium">Military:</span> {selectedCountry.startingResources?.military || '?'}
                      </div>
                      <div className="text-sm text-purple-300">
                        <span className="font-medium">Culture:</span> {selectedCountry.startingResources?.culture || '?'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {Object.entries(groupedCountries).map(([region, regionCountries]) => (
                  <div key={region} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="text-gray-200 font-medium mb-2 border-b border-gray-700 pb-1">{region}</h3>
                    <div className="max-h-60 overflow-y-auto pr-1">
                      {regionCountries.map(country => (
                        <div
                          key={country.id}
                          onClick={() => handleSelectCountry(country)}
                          className={`flex items-center p-2 rounded-md cursor-pointer transition-colors mb-1 ${
                            selectedCountry?.id === country.id
                              ? 'bg-blue-900 border border-blue-600'
                              : 'hover:bg-gray-700'
                          }`}
                        >
                          <span className="text-xl mr-2">{country.flag}</span>
                          <span className="text-white">{country.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-md mx-auto">
              {selectedCountry && (
                <div className="mb-6 text-center">
                  <div className="text-6xl mb-2">{selectedCountry.flag}</div>
                  <h3 className="text-2xl font-bold text-white">{selectedCountry.name}</h3>
                </div>
              )}
              
              <div className="w-full mb-8">
                <label className="block text-white text-lg mb-2">Enter Your Leader's Name:</label>
                <input
                  type="text"
                  value={inputLeaderName}
                  onChange={(e) => {
                    setInputLeaderName(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. President John Smith"
                  className="bg-gray-800 text-white p-3 rounded-md border border-gray-700 w-full text-lg"
                />
                <p className="text-gray-400 text-sm mt-2">This is how you'll be addressed throughout the game.</p>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full mb-4">
                <h4 className="text-white font-medium mb-2">Preview:</h4>
                <p className="text-gray-300">
                  <span className="text-blue-300">{inputLeaderName || "[Your Name]"}</span> of{" "}
                  <span className="text-yellow-300">{selectedCountry?.name || "[Country]"}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 p-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={step === 'nation' ? handleCompleteNationSelection : handleCompleteSetup}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {step === 'nation' ? 'Continue' : 'Start Your Journey'}
          </button>
        </div>
      </div>
    </div>
  );
} 