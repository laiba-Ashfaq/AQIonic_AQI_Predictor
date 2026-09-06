import React, { useState } from 'react';
import { 
  SHAPAttribution, 
  WeatherData
} from '../types/aqi';
import { getCategoryInfo } from '../services/airQualityService';
import { 
  Sparkles, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart2
} from 'lucide-react';
import { WhatIfSimulator } from './WhatIfSimulator';

interface SHAPExplainabilityProps {
  shapAttributions: SHAPAttribution[];
  currentAQI: number;
  weather: WeatherData;
  pm25: number;
  no2: number;
}

export const SHAPExplainability: React.FC<SHAPExplainabilityProps> = ({
  shapAttributions,
  currentAQI,
  weather,
  pm25,
  no2
}) => {
  const [activeTab, setActiveTab] = useState<'waterfall' | 'global_importance' | 'what_if'>('waterfall');
  const baselineAQI = 45; // Global background baseline

  const categoryInfo = getCategoryInfo(currentAQI);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-[#102B33] uppercase tracking-tight">
                SHAP (SHapley Additive exPlanations) & Feature Attribution
              </h2>
            </div>
            <p className="text-xs text-[#517280] mt-1">
              Game-theoretic interpretability explaining how meteorological conditions and pollutant lags drive current air quality predictions.
            </p>
          </div>

          {/* Sub-view Switcher */}
          <div className="flex items-center gap-1.5 bg-[#F0F5F8] p-1.5 rounded-2xl border border-[#CFDDE7] text-xs">
            <button
              onClick={() => setActiveTab('waterfall')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'waterfall'
                  ? 'bg-[#1D4B59] text-white shadow-sm'
                  : 'text-[#517280] hover:text-[#102B33]'
              }`}
            >
              Waterfall Attribution
            </button>

            <button
              onClick={() => setActiveTab('what_if')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'what_if'
                  ? 'bg-[#1D4B59] text-white shadow-sm'
                  : 'text-[#517280] hover:text-[#102B33]'
              }`}
            >
              What-If Simulator
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      {activeTab === 'waterfall' && (
        <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2ECF2] pb-4">
            <div>
              <h3 className="text-sm font-black text-[#102B33] uppercase tracking-tight">
                Current Prediction SHAP Decomposition
              </h3>
              <p className="text-xs text-[#517280] mt-0.5">
                Baseline Clean Air Reference: <strong className="font-mono text-[#102B33]">{baselineAQI} AQI</strong> → Predicted: <strong className="font-mono text-[#1D4B59]">{currentAQI} AQI</strong> ({categoryInfo.name})
              </p>
            </div>
          </div>

          {/* SHAP Feature Contribution List */}
          <div className="space-y-3 font-mono text-xs">
            {shapAttributions.map((attr, idx) => {
              const isPositive = attr.shapValue >= 0;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-[#F7FAFC] border border-[#CFDDE7] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border font-bold ${isPositive ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-sans font-bold text-[#102B33] text-xs">{attr.displayName}</div>
                      <div className="font-sans text-[11px] text-[#517280] mt-0.5">{attr.explanation}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <span className="text-[10px] text-[#517280] font-sans block">Value</span>
                      <span className="font-bold text-[#102B33]">{attr.featureValue} {attr.unit}</span>
                    </div>
                    <div className="min-w-[80px]">
                      <span className="text-[10px] text-[#517280] font-sans block">SHAP Contribution</span>
                      <span className={`font-black ${isPositive ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {isPositive ? `+${attr.shapValue}` : attr.shapValue} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'what_if' && (
        <WhatIfSimulator
          currentAQI={currentAQI}
          weather={weather}
          pm25={pm25}
          no2={no2}
        />
      )}

    </div>
  );
};
