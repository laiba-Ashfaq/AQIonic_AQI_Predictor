/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SAMPLE_CITIES } from './data/sampleCities';
import { CityLocation, FetchResult, HourlyForecastPoint } from './types/aqi';
import { fetchLiveCityAQI } from './services/airQualityService';
import { Header } from './components/Header';
import { CurrentOverview } from './components/CurrentOverview';
import { PollutantGrid } from './components/PollutantGrid';
import { ForecastTimeline } from './components/ForecastTimeline';
import { SHAPExplainability } from './components/SHAPExplainability';
import { ModelZoo } from './components/ModelZoo';
import { EDADashboard } from './components/EDADashboard';
import { FeatureStoreView } from './components/FeatureStoreView';
import { HealthAlerts } from './components/HealthAlerts';
import { AICopilot } from './components/AICopilot';
import { CityComparison } from './components/CityComparison';
import { Wind } from 'lucide-react';

export default function App() {
  const [currentCity, setCurrentCity] = useState<CityLocation>(SAMPLE_CITIES[0]);
  const [data, setData] = useState<FetchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('forecast');
  const [selectedModelId, setSelectedModelId] = useState<string>('stacking_ensemble');
  const [selectedForecastPoint, setSelectedForecastPoint] = useState<HourlyForecastPoint | null>(null);

  const loadCityData = useCallback(async (city: CityLocation) => {
    setIsLoading(true);
    try {
      const result = await fetchLiveCityAQI(city);
      setData(result);
      if (result.hourlyForecast && result.hourlyForecast.length > 0) {
        setSelectedForecastPoint(result.hourlyForecast[0]);
      }
    } catch (err) {
      console.error('Failed to load city AQI data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCityData(currentCity);
  }, [currentCity, loadCityData]);

  const handleSelectCity = (city: CityLocation) => {
    setCurrentCity(city);
  };

  const handleRefresh = () => {
    loadCityData(currentCity);
  };

  return (
    <div className="min-h-screen bg-[#DDE7EE] text-[#102B33] flex flex-col font-sans antialiased">
      
      {/* App Header & Navigation */}
      <Header
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={data?.isLive ?? true}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && !data ? (
          <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 text-slate-600">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-slate-300 border-t-[#1D4B59] animate-spin" />
              <Wind className="w-6 h-6 text-[#1D4B59] absolute animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[#102B33]">
                Streaming Atmospheric & Pollutant Telemetry...
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Fetching atmospheric feeds and running ML inference for {currentCity.name}.
              </p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            {/* TAB 1: Real-Time Overview & 72-Hour Forecast Dashboard */}
            {activeTab === 'forecast' && (
              <div className="space-y-6">
                {/* Hero Current State Overview */}
                <CurrentOverview 
                  data={data}
                  onOpenShapTab={() => setActiveTab('shap')}
                />

                {/* 6 EPA Criteria Pollutants */}
                <PollutantGrid pollutants={data.pollutants} />

                {/* 72-Hour Forecast Timeline & 3-Day Summaries */}
                <ForecastTimeline
                  hourlyForecast={data.hourlyForecast}
                  dailySummaries={data.dailySummaries}
                  onSelectHour={(pt) => setSelectedForecastPoint(pt)}
                />
              </div>
            )}

            {/* TAB 2: AI Copilot Chatbot */}
            {activeTab === 'copilot' && (
              <AICopilot 
                onSelectCity={(city) => {
                  handleSelectCity(city);
                  setActiveTab('forecast');
                }} 
              />
            )}

            {/* TAB 3: Multi-City AQI Comparison */}
            {activeTab === 'comparison' && (
              <CityComparison 
                onSelectCity={(city) => {
                  handleSelectCity(city);
                  setActiveTab('forecast');
                }}
              />
            )}

            {/* TAB 4: Exploratory Data Analysis (EDA) */}
            {activeTab === 'eda' && (
              <EDADashboard />
            )}

            {/* TAB 5: ML Model Zoo & Benchmark Matrix */}
            {activeTab === 'models' && (
              <ModelZoo
                selectedModelId={selectedModelId}
                onSelectModel={(id) => setSelectedModelId(id)}
              />
            )}

            {/* TAB 6: Feature Store & Automated CI/CD MLOps */}
            {activeTab === 'feature_store' && (
              <FeatureStoreView cityName={currentCity.name} />
            )}

            {/* TAB 7: SHAP Explainability & Counterfactual What-If Simulator */}
            {activeTab === 'shap' && (
              <SHAPExplainability
                shapAttributions={data.shapAttributions}
                currentAQI={data.currentAQI}
                weather={data.weather}
                pm25={data.pollutants.find(p => p.code === 'PM2.5')?.value || 25}
                no2={data.pollutants.find(p => p.code === 'NO2')?.value || 20}
              />
            )}

            {/* TAB 8: Public Health & Hazardous Alert Center */}
            {activeTab === 'alerts' && (
              <HealthAlerts currentAQI={data.currentAQI} />
            )}

          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#C5D7E3] bg-white text-slate-600 py-4 text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#1D4B59] text-white flex items-center justify-center">
              <Wind className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-[#102B33]">AQIonic</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            © 2026 AQIonic Air Quality Intelligence.
          </div>
        </div>
      </footer>

    </div>
  );
}
