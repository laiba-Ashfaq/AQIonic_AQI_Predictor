import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell
} from 'recharts';
import { 
  Columns3, 
  MapPin, 
  Wind, 
  Thermometer, 
  Droplets, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { CityLocation, FetchResult } from '../types/aqi';
import { SAMPLE_CITIES } from '../data/sampleCities';
import { fetchLiveCityAQI, getCategoryInfo } from '../services/airQualityService';

interface CityComparisonProps {
  onSelectCity?: (city: CityLocation) => void;
}

export const CityComparison: React.FC<CityComparisonProps> = ({ onSelectCity }) => {
  // Default selected cities to compare: Lahore, Karachi, Islamabad
  const [selectedCities, setSelectedCities] = useState<CityLocation[]>([
    SAMPLE_CITIES[0], // Lahore
    SAMPLE_CITIES[1], // Karachi
    SAMPLE_CITIES[2]  // Islamabad
  ]);

  const [cityDataList, setCityDataList] = useState<FetchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load live data for all selected cities
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(selectedCities.map(c => fetchLiveCityAQI(c)));
        if (isMounted) {
          setCityDataList(results);
        }
      } catch (err) {
        console.error('Failed to load city comparison data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAll();
    return () => { isMounted = false; };
  }, [selectedCities]);

  const toggleCitySelection = (city: CityLocation) => {
    const exists = selectedCities.some(c => c.id === city.id);
    if (exists) {
      if (selectedCities.length <= 2) {
        alert('Please keep at least 2 cities selected for comparison.');
        return;
      }
      setSelectedCities(selectedCities.filter(c => c.id !== city.id));
    } else {
      if (selectedCities.length >= 4) {
        alert('You can compare up to 4 cities simultaneously.');
        return;
      }
      setSelectedCities([...selectedCities, city]);
    }
  };

  // Build chart dataset
  const chartData = cityDataList.map(item => ({
    cityName: item.city.name,
    aqi: item.currentAQI,
    pm25: item.pollutants.find(p => p.code === 'PM2.5')?.value || 0,
    pm10: item.pollutants.find(p => p.code === 'PM10')?.value || 0,
    no2: item.pollutants.find(p => p.code === 'NO2')?.value || 0,
    temp: item.weather.temperature,
    humidity: item.weather.humidity,
    color: getCategoryInfo(item.currentAQI).color
  }));

  // Rank cities by AQI
  const rankedData = [...cityDataList].sort((a, b) => a.currentAQI - b.currentAQI);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1D4B59] text-white flex items-center justify-center shadow-xs">
              <Columns3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#102B33] uppercase tracking-tight">
                Multi-City Side-by-Side AQI Comparison
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Compare real-time air quality indices, PM2.5 concentrations, weather, and health risks across selected cities.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Cities Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Active ({selectedCities.length}/4):</span>
          {selectedCities.map(c => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#1D4B59] text-white text-xs font-bold shadow-2xs"
            >
              {c.name}
              <button
                onClick={() => toggleCitySelection(c)}
                className="hover:text-rose-300 ml-1 text-xs"
                title="Remove city"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* City Selector Pills Bar */}
      <div className="bg-white border border-[#CFDDE7] rounded-2xl p-4 shadow-xs space-y-2">
        <div className="text-xs font-bold text-[#102B33] flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[#1D4B59]" />
          Select Cities to Compare (Click to toggle):
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_CITIES.map(city => {
            const isSelected = selectedCities.some(c => c.id === city.id);
            return (
              <button
                key={city.id}
                onClick={() => toggleCitySelection(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#1D4B59] text-white shadow-xs'
                    : 'bg-[#F0F5F8] text-[#102B33] hover:bg-[#E3EFF4] border border-[#CFDDE7]'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {city.name}
                {isSelected && <span className="text-emerald-300 font-bold ml-0.5">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Spinner or Content Grid */}
      {isLoading ? (
        <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#1D4B59] animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-[#102B33]">Fetching live telemetry for comparison cities...</h3>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Side-by-Side City Metric Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-${selectedCities.length} gap-5`}>
            {cityDataList.map((item) => {
              const catInfo = getCategoryInfo(item.currentAQI);
              const pm25 = item.pollutants.find(p => p.code === 'PM2.5')?.value || 0;
              const pm10 = item.pollutants.find(p => p.code === 'PM10')?.value || 0;

              return (
                <div 
                  key={item.city.id}
                  className="bg-white border border-[#CFDDE7] rounded-[24px] p-5 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Top Color Accent Line */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-2" 
                    style={{ backgroundColor: catInfo.color }}
                  />

                  <div>
                    {/* City Name & Country */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black text-[#102B33]">{item.city.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{item.city.country}</p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: catInfo.color }}
                      >
                        AQI {item.currentAQI}
                      </span>
                    </div>

                    {/* Category Label */}
                    <div className="mt-3 inline-block font-bold text-xs px-2.5 py-1 rounded-lg bg-[#F0F5F8] border border-[#CFDDE7] text-[#102B33]">
                      {catInfo.name}
                    </div>

                    {/* Telemetry Breakdown */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      <div className="bg-[#F8FAFC] border border-slate-200 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">PM2.5 Concentration</span>
                        <span className="font-bold text-sm text-[#102B33]">{pm25} µg/m³</span>
                      </div>
                      <div className="bg-[#F8FAFC] border border-slate-200 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">PM10 Concentration</span>
                        <span className="font-bold text-sm text-[#102B33]">{pm10} µg/m³</span>
                      </div>
                      <div className="bg-[#F8FAFC] border border-slate-200 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">Temperature</span>
                        <span className="font-bold text-sm text-[#102B33]">{item.weather.temperature}°C</span>
                      </div>
                      <div className="bg-[#F8FAFC] border border-slate-200 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-500 block">Wind Velocity</span>
                        <span className="font-bold text-sm text-[#102B33]">{item.weather.windSpeed} km/h</span>
                      </div>
                    </div>
                  </div>

                  {/* Health Advisory Brief */}
                  <div className="pt-3 border-t border-[#E2ECF2] text-[11px] text-slate-600 space-y-1">
                    <span className="font-bold text-[#102B33] block">Health Guidance:</span>
                    <p className="line-clamp-2">{catInfo.healthImplications}</p>
                  </div>

                  {onSelectCity && (
                    <button
                      onClick={() => onSelectCity(item.city)}
                      className="w-full py-2 bg-[#1D4B59] hover:bg-[#163C47] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                    >
                      Focus Dashboard on {item.city.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparative Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Air Quality Index (AQI) Comparison */}
            <div className="bg-white border border-[#CFDDE7] rounded-[24px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-[#102B33]">AQI Index Comparison Across Cities</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF2" vertical={false} />
                    <XAxis dataKey="cityName" stroke="#517280" fontSize={11} fontWeight={700} />
                    <YAxis stroke="#517280" fontSize={11} fontWeight={700} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CFDDE7', borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="aqi" radius={[8, 8, 0, 0]} name="AQI Index">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: PM2.5 Fine Particulate Comparison */}
            <div className="bg-white border border-[#CFDDE7] rounded-[24px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-[#102B33]">PM2.5 Mass Burden Comparison (µg/m³)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF2" vertical={false} />
                    <XAxis dataKey="cityName" stroke="#517280" fontSize={11} fontWeight={700} />
                    <YAxis stroke="#517280" fontSize={11} fontWeight={700} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CFDDE7', borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="pm25" fill="#1D4B59" radius={[8, 8, 0, 0]} name="PM2.5 Concentration (µg/m³)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Ranking & Health Risk Safety Table */}
          <div className="bg-white border border-[#CFDDE7] rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-[#102B33]">Air Quality Rankings (Cleanest to Most Polluted)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2ECF2] bg-[#F8FAFC]">
                    <th className="p-3 font-bold text-[#102B33]">Rank</th>
                    <th className="p-3 font-bold text-[#102B33]">City</th>
                    <th className="p-3 font-bold text-[#102B33]">AQI Index</th>
                    <th className="p-3 font-bold text-[#102B33]">PM2.5</th>
                    <th className="p-3 font-bold text-[#102B33]">Temp / Humidity</th>
                    <th className="p-3 font-bold text-[#102B33]">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedData.map((item, idx) => {
                    const catInfo = getCategoryInfo(item.currentAQI);
                    const pm25 = item.pollutants.find(p => p.code === 'PM2.5')?.value || 0;

                    return (
                      <tr key={item.city.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold font-mono text-slate-500">#{idx + 1}</td>
                        <td className="p-3 font-bold text-[#102B33]">{item.city.name}, {item.city.country}</td>
                        <td className="p-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: catInfo.color }}
                          >
                            {item.currentAQI}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{pm25} µg/m³</td>
                        <td className="p-3 text-slate-600">{item.weather.temperature}°C / {item.weather.humidity}%</td>
                        <td className="p-3 font-medium text-slate-700">{catInfo.name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
