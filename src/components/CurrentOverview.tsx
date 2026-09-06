import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  Sun, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AQIGauge } from './AQIGauge';
import { FetchResult } from '../types/aqi';
import { getCategoryInfo } from '../services/airQualityService';

interface CurrentOverviewProps {
  data: FetchResult;
  onOpenAlertsModal?: () => void;
  onOpenShapTab?: () => void;
}

export const CurrentOverview: React.FC<CurrentOverviewProps> = ({
  data,
  onOpenAlertsModal,
  onOpenShapTab
}) => {
  const { currentAQI, dominantPollutant, weather, pollutants } = data;
  const catInfo = getCategoryInfo(currentAQI);

  const dominantPollutantData = pollutants.find(p => p.code.includes(dominantPollutant) || p.name.includes(dominantPollutant)) || pollutants[0];

  return (
    <div className="space-y-5">
      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Card: Main AQI Gauge & Risk Classification */}
        <div className="lg:col-span-5 bg-white border border-[#CFDDE7] rounded-[28px] p-6 relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                <Gauge className="w-4 h-4 text-[#1D4B59]" />
              </span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#517280] block">
                  Atmospheric Status
                </span>
                <span className="text-xs font-bold text-[#102B33]">Real-Time Sensor Index</span>
              </div>
            </div>
            <span className="text-[11px] text-[#1D4B59] font-mono bg-[#EEF4F8] px-3 py-1 rounded-full border border-[#D5E3EC] font-bold">
              Live Stream
            </span>
          </div>

          <div className="my-4 flex justify-center">
            <AQIGauge aqi={currentAQI} size={280} />
          </div>

          {/* Quick Health Callout */}
          <div className="p-4 rounded-2xl border border-[#CFDDE7] bg-[#F7FAFC]">
            <div className="flex items-start gap-3">
              {currentAQI > 100 ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              )}
              <div>
                <h4 className="text-xs font-bold text-[#102B33] tracking-tight">
                  {catInfo.name} Air Quality
                </h4>
                <p className="text-xs text-[#517280] mt-1 leading-relaxed">
                  {catInfo.healthImplications}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Dominant Pollutant & Weather Sensor Matrix */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Dominant Pollutant Card */}
          <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2ECF2] pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#517280]">
                  Primary Air Quality Determinant
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <h3 className="text-2xl font-black text-[#102B33] tracking-tight">
                    {dominantPollutantData.name}
                  </h3>
                  <span className="text-sm font-bold text-[#1D4B59] font-mono">
                    {dominantPollutantData.value} {dominantPollutantData.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                  Sub-Index: {dominantPollutantData.aqiContribution} AQI
                </span>
              </div>
            </div>

            {/* Description & Sources */}
            <p className="text-xs text-[#517280] mt-3.5 leading-relaxed">
              {dominantPollutantData.description}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#517280]">Key Emission Sources:</span>
              {dominantPollutantData.sources.map((src, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-[#F2F6F9] text-[#102B33] border border-[#D5E3EC] font-medium">
                  {src}
                </span>
              ))}
            </div>

            {/* WHO Guideline Benchmark Bar */}
            <div className="mt-4 pt-3.5 border-t border-[#E2ECF2]">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-[#517280] font-medium">Concentration vs. WHO Guideline ({dominantPollutantData.standardLimit} {dominantPollutantData.unit})</span>
                <span className={`font-mono font-bold ${dominantPollutantData.value > dominantPollutantData.standardLimit ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {(dominantPollutantData.value / dominantPollutantData.standardLimit).toFixed(1)}x WHO Limit
                </span>
              </div>
              <div className="w-full bg-[#EEF4F8] rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    dominantPollutantData.value > dominantPollutantData.standardLimit * 3 
                      ? 'bg-rose-500' 
                      : dominantPollutantData.value > dominantPollutantData.standardLimit 
                      ? 'bg-amber-500' 
                      : 'bg-[#1D4B59]'
                  }`}
                  style={{ width: `${Math.min(100, (dominantPollutantData.value / (dominantPollutantData.standardLimit * 3)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Meteorological Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Temperature */}
            <div className="bg-white border border-[#CFDDE7] rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#517280] tracking-wider">Temp</span>
                <div className="text-sm font-black text-[#102B33] font-mono">{weather.temperature}°C</div>
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-white border border-[#CFDDE7] rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#517280] tracking-wider">Humidity</span>
                <div className="text-sm font-black text-[#102B33] font-mono">{weather.humidity}%</div>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="bg-white border border-[#CFDDE7] rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#517280] tracking-wider">Surface Wind</span>
                <div className="text-sm font-black text-[#102B33] font-mono">{weather.windSpeed} km/h</div>
              </div>
            </div>

            {/* UV Index */}
            <div className="bg-white border border-[#CFDDE7] rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
              <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-600">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#517280] tracking-wider">UV Index</span>
                <div className="text-sm font-black text-[#102B33] font-mono">{weather.uvIndex}</div>
              </div>
            </div>
          </div>

          {/* Quick Action Bar for SHAP Explanations */}
          {onOpenShapTab && (
            <div className="bg-white border border-[#CFDDE7] rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#1D4B59] shrink-0" />
                <span className="text-xs text-[#102B33]">
                  ML TreeSHAP Attribution: <strong className="text-[#1D4B59]">24h PM2.5 persistence & Wind speed</strong> are driving current air quality.
                </span>
              </div>
              <button
                onClick={onOpenShapTab}
                className="px-4 py-2 text-xs font-bold bg-[#1D4B59] hover:bg-[#153843] text-white rounded-2xl shrink-0 transition-colors shadow-sm flex items-center gap-1"
              >
                <span>Inspect SHAP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
