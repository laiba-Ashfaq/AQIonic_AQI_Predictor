import React, { useState } from 'react';
import { WeatherData } from '../types/aqi';
import { getCategoryInfo, computeSHAPAttributions } from '../services/airQualityService';
import { 
  Sliders, 
  Wind, 
  Thermometer, 
  Droplets, 
  Car, 
  RotateCcw, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp,
  Sparkles,
  Layers
} from 'lucide-react';

interface WhatIfSimulatorProps {
  initialWeather: WeatherData;
  initialAQI: number;
  initialPM25: number;
  initialNO2: number;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  initialWeather,
  initialAQI,
  initialPM25,
  initialNO2
}) => {
  const [windSpeed, setWindSpeed] = useState(initialWeather.windSpeed);
  const [temperature, setTemperature] = useState(initialWeather.temperature);
  const [humidity, setHumidity] = useState(initialWeather.humidity);
  const [trafficScale, setTrafficScale] = useState(1.0); // 0.2x to 2.5x
  const [pblHeight, setPblHeight] = useState(initialWeather.boundaryLayerHeight || 800);

  // Compute simulated AQI based on ML Regressor approximation response surface
  const calculateSimulatedAQI = () => {
    // Physics & ML regression proxy formula
    let simAqi = initialAQI;

    // Wind speed dispersion impact: High wind ventilates exponentially
    const windDelta = windSpeed - initialWeather.windSpeed;
    simAqi -= windDelta * 2.8;

    // Temperature impact: Higher temp accelerates photochemical reactions & convection
    const tempDelta = temperature - initialWeather.temperature;
    simAqi += tempDelta * 1.2;

    // Humidity impact: Higher humidity causes hygroscopic aerosol particle growth
    const humDelta = humidity - initialWeather.humidity;
    simAqi += humDelta * 0.45;

    // Traffic / Emissions emission scaling
    const emissionFactor = (trafficScale - 1.0) * 35;
    simAqi += emissionFactor;

    // Planetary Boundary Layer inversion compression
    const pblFactor = ((800 - pblHeight) / 800) * 40;
    simAqi += pblFactor;

    return Math.max(10, Math.min(500, Math.round(simAqi)));
  };

  const simulatedAQI = calculateSimulatedAQI();
  const initialCat = getCategoryInfo(initialAQI);
  const simCat = getCategoryInfo(simulatedAQI);
  const aqiDiff = simulatedAQI - initialAQI;

  const handleReset = () => {
    setWindSpeed(initialWeather.windSpeed);
    setTemperature(initialWeather.temperature);
    setHumidity(initialWeather.humidity);
    setTrafficScale(1.0);
    setPblHeight(initialWeather.boundaryLayerHeight || 800);
  };

  const simWeather: WeatherData = {
    ...initialWeather,
    windSpeed,
    temperature,
    humidity,
    boundaryLayerHeight: pblHeight
  };

  const simShap = computeSHAPAttributions(
    simulatedAQI, 
    simWeather, 
    Math.round(initialPM25 * trafficScale), 
    Math.round(initialNO2 * trafficScale)
  );

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                "What-If" Counterfactual Simulation Studio
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Adjust meteorological controls and emission policies to observe instant ML inference re-prediction & SHAP shifts.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700/60 flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
        </div>

        {/* Live Comparison Gauge Bar */}
        <div className="mt-6 p-5 rounded-3xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          
          {/* Baseline State */}
          <div className="text-center p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Actual Current AQI
            </span>
            <div className="text-4xl font-black my-1 font-mono tracking-tight" style={{ color: initialCat.color }}>
              {initialAQI}
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${initialCat.badgeBg}`}>
              {initialCat.name}
            </span>
          </div>

          {/* Transition / Delta Indicator */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-slate-500 hidden md:block" />
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                aqiDiff > 0 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : aqiDiff < 0 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {aqiDiff > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{aqiDiff} AQI (Worsens Air)
                  </>
                ) : aqiDiff < 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    {aqiDiff} AQI (Improves Air)
                  </>
                ) : (
                  'No Change (Baseline)'
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-mono">
              Counterfactual Model Response
            </span>
          </div>

          {/* Simulated State */}
          <div className="text-center p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Simulated Forecast AQI
            </span>
            <div className="text-4xl font-black my-1 font-mono tracking-tight" style={{ color: simCat.color }}>
              {simulatedAQI}
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${simCat.badgeBg}`}>
              {simCat.name}
            </span>
          </div>

        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Slider 1: Wind Speed */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3.5 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              Surface Wind Speed (Ventilation)
            </span>
            <span className="font-mono font-black text-cyan-400">{windSpeed} km/h</span>
          </div>
          <input
            type="range"
            min="1"
            max="45"
            step="0.5"
            value={windSpeed}
            onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
            aria-label="Surface Wind Speed"
            className="w-full accent-cyan-500 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Stagnant Calms (1 km/h)</span>
            <span>Gale Breeze (45 km/h)</span>
          </div>
        </div>

        {/* Slider 2: Urban Traffic & Industrial Emissions */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3.5 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-rose-400" />
              Urban Traffic & Industrial Emissions Scale
            </span>
            <span className="font-mono font-black text-rose-400">{trafficScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.05"
            value={trafficScale}
            onChange={(e) => setTrafficScale(parseFloat(e.target.value))}
            aria-label="Urban Traffic and Industrial Emissions Scale"
            className="w-full accent-rose-500 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Strict Lockdown / EV (0.2x)</span>
            <span>Peak Congestion (2.5x)</span>
          </div>
        </div>

        {/* Slider 3: Temperature */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3.5 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-400" />
              Ambient Temperature
            </span>
            <span className="font-mono font-black text-orange-400">{temperature}°C</span>
          </div>
          <input
            type="range"
            min="-5"
            max="48"
            step="1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            aria-label="Ambient Temperature"
            className="w-full accent-orange-500 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Freezing (-5°C)</span>
            <span>Extreme Heatwave (48°C)</span>
          </div>
        </div>

        {/* Slider 4: Planetary Boundary Layer Height */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3.5 backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Planetary Boundary Layer (Inversion Cap)
            </span>
            <span className="font-mono font-black text-indigo-400">{pblHeight} m</span>
          </div>
          <input
            type="range"
            min="200"
            max="2000"
            step="50"
            value={pblHeight}
            onChange={(e) => setPblHeight(parseFloat(e.target.value))}
            aria-label="Planetary Boundary Layer Height"
            className="w-full accent-indigo-500 bg-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Shallow Inversion (200m)</span>
            <span>Deep Mixing Volume (2000m)</span>
          </div>
        </div>

      </div>

      {/* Dynamic Simulated SHAP Feedback */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl backdrop-blur-sm">
        <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">
          Simulated Feature Attribution Shift
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {simShap.slice(0, 3).map((s, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              <div className="flex justify-between font-bold text-white mb-1">
                <span>{s.displayName}</span>
                <span className={s.shapValue >= 0 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                  {s.shapValue >= 0 ? `+${s.shapValue}` : s.shapValue}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {s.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
