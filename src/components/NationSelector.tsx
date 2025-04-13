import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import countries from '../data/countries';

export default function NationSelector() {
  const { nationName, leaderName, setNation, setLeader } = useGameStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempNationName, setTempNationName] = useState(nationName);
  const [tempLeaderName, setTempLeaderName] = useState(leaderName);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [showCountryList, setShowCountryList] = useState(false);
  
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
  
  const handleSubmit = () => {
    if (tempNationName.trim()) {
      setNation(tempNationName);
    }
    
    if (tempLeaderName.trim()) {
      setLeader(tempLeaderName);
    }
    
    setIsEditing(false);
  };
  
  const selectCountry = (country: typeof countries[0]) => {
    setTempNationName(country.name);
    setShowCountryList(false);
  };
  
  return (
    <div className="relative">
      {isEditing ? (
        <div className="p-4 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg">
          <h3 className="font-medium mb-3">Edit Nation Details</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nation Name</label>
              <div className="flex">
                <input 
                  type="text"
                  value={tempNationName}
                  onChange={(e) => setTempNationName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-l px-3 py-2 text-white"
                />
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded-r"
                  onClick={() => setShowCountryList(!showCountryList)}
                >
                  <span>🌎</span>
                </button>
              </div>
            </div>
            
            {showCountryList && (
              <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-auto">
                <div className="sticky top-0 bg-gray-900 p-2 border-b border-gray-700">
                  <input
                    type="text"
                    placeholder="Search countries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {regions.map(region => (
                      <button
                        key={region}
                        className={`px-2 py-1 text-xs rounded ${
                          regionFilter === region 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-300'
                        }`}
                        onClick={() => setRegionFilter(region)}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-2">
                  {Object.entries(groupedCountries).map(([region, regionCountries]) => (
                    <div key={region} className="mb-4">
                      <h4 className="text-gray-400 text-sm font-medium mb-1">{region}</h4>
                      <div className="space-y-1">
                        {regionCountries.map(country => (
                          <div 
                            key={country.id}
                            className="flex items-center p-2 hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => selectCountry(country)}
                          >
                            <span className="text-lg mr-2">{country.flag}</span>
                            <span>{country.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Leader Name</label>
              <input 
                type="text"
                value={tempLeaderName}
                onChange={(e) => setTempLeaderName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={handleSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="flex items-center space-x-2 px-3 py-2 bg-gray-900/60 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-gray-900/80"
          onClick={() => setIsEditing(true)}
        >
          <div className="text-2xl">🏛️</div>
          <div>
            <div className="font-medium">{nationName}</div>
            <div className="text-sm text-gray-400">Leader: {leaderName}</div>
          </div>
          <div className="text-gray-400">✏️</div>
        </div>
      )}
    </div>
  );
} 