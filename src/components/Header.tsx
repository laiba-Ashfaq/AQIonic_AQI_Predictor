import React, { useState } from 'react';
import { 
  Wind, 
  MapPin, 
  Search, 
  Navigation, 
  RefreshCw, 
  Activity, 
  Cpu, 
  BarChart3, 
  ShieldAlert, 
  Database, 
  Sliders,
  Bot,
  Columns3
} from 'lucide-react';
import { CityLocation } from '../types/aqi';
import { SAMPLE_CITIES } from '../data/sampleCities';
import { searchCities } from '../services/airQualityService';

interface HeaderProps {
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  onRefresh: () => void;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onSelectCity,
  onRefresh,
  isLoading,
  activeTab,
  setActiveTab,
  isLive
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchDropdown(true);
      const results = await searchCities(val);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectCity = (city: CityLocation) => {
    onSelectCity(city);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geoCity: CityLocation = {
          id: `gps-${lat.toFixed(3)}-${lon.toFixed(3)}`,
          name: `My GPS Location`,
          country: `Local Area (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
          countryCode: 'GPS',
          latitude: lat,
          longitude: lon,
          climateZone: 'Local Microclimate'
        };
        onSelectCity(geoCity);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied/failed:', err);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const navTabs = [
    { id: 'forecast', label: 'Dashboard & 72h Forecast', icon: BarChart3 },
    { id: 'copilot', label: 'AI Copilot Chatbot', icon: Bot },
    { id: 'comparison', label: 'City Comparison', icon: Columns3 },
    { id: 'eda', label: 'EDA Analytics', icon: Activity },
    { id: 'models', label: 'Model Zoo & Benchmarks', icon: Cpu },
    { id: 'feature_store', label: 'Feature Store', icon: Database },
    { id: 'shap', label: 'SHAP & Simulator', icon: Sliders },
    { id: 'alerts', label: 'Health Advisories', icon: ShieldAlert }
  ];


  return (
    <header className="sticky top-0 z-50 bg-[#1D4B59] text-white shadow-md transition-all">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#1D4B59] flex items-center justify-center font-bold shadow-sm">
              <Wind className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  AQ<span className="text-sky-200">Ionic</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2A6171] text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  Live Sensor Grid
                </span>
              </div>
            </div>
          </div>

          {/* Search & City Selection Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* City Search Bar with Autocomplete */}
            <div className="relative flex-1 sm:w-64">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs bg-[#163C47] border border-[#2B6070] rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all font-medium"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showSearchDropdown && (
                <div className="absolute left-0 right-0 mt-2 bg-[#163C47] border border-[#2B6070] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto divide-y divide-[#235160]">
                  {isSearching ? (
                    <div className="p-3.5 text-xs text-slate-300 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-300" /> Searching location...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleSelectCity(city)}
                        className="w-full px-3.5 py-2.5 text-left text-xs text-white hover:bg-[#1E4C5B] hover:text-sky-200 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium">{city.name}</span>
                        <span className="text-[11px] text-slate-300">{city.country}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3.5 text-xs text-slate-300 text-center">
                      No matching cities found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Benchmark Cities Dropdown */}
            <select
              value={currentCity.id}
              onChange={(e) => {
                const found = SAMPLE_CITIES.find(c => c.id === e.target.value);
                if (found) onSelectCity(found);
              }}
              aria-label="Select benchmark city"
              className="bg-[#163C47] text-xs text-white px-3.5 py-2 rounded-2xl border border-[#2B6070] focus:outline-none focus:ring-2 focus:ring-sky-300 cursor-pointer font-medium hover:bg-[#1E4C5B] transition-colors"
            >
              <optgroup label="Benchmark Megacities">
                {SAMPLE_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.country}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* GPS Geolocation Button */}
            <button
              onClick={handleGeolocation}
              disabled={isLocating}
              title="Detect My Location via GPS"
              className="p-2 text-xs bg-[#163C47] hover:bg-[#1E4C5B] text-white border border-[#2B6070] rounded-2xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-300' : ''}`} />
              <span className="hidden sm:inline font-medium">GPS</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Live Sensor Feeds"
              className="px-3.5 py-2 text-xs bg-white text-[#1D4B59] hover:bg-sky-50 border border-white rounded-2xl flex items-center gap-1.5 font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Feeds</span>
            </button>
          </div>

        </div>

        {/* Current Location Badge & Live Status Bar */}
        <div className="mt-2.5 pt-2 border-t border-[#2A5D6C] flex flex-wrap items-center justify-between text-xs text-slate-200 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center text-white font-semibold">
              <MapPin className="w-3.5 h-3.5 mr-1 text-sky-300" />
              {currentCity.name}, {currentCity.country}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-slate-200">Lat: {currentCity.latitude.toFixed(2)}°, Lon: {currentCity.longitude.toFixed(2)}°</span>
            {currentCity.climateZone && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 hidden sm:inline">{currentCity.climateZone}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              {isLive ? '● 12 Atmospheric Sensors Active' : '● Physics Stream Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar - Ref Picture White Active Pills */}
      <div className="bg-[#173E4A] border-t border-[#255866] overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-[#1D4B59] shadow-md'
                    : 'text-slate-200 hover:text-white hover:bg-[#1E4C5B]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1D4B59]' : 'text-slate-300'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
