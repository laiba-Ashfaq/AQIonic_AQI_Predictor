import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine
} from 'recharts';
import { 
  HourlyForecastPoint, 
  DailySummary 
} from '../types/aqi';
import { 
  AQI_CATEGORIES, 
  getCategoryInfo 
} from '../services/airQualityService';
import { 
  Calendar, 
  TrendingUp, 
  Sun, 
  Moon, 
  Wind
} from 'lucide-react';

interface ForecastTimelineProps {
  hourlyForecast: HourlyForecastPoint[];
  dailySummaries: DailySummary[];
  onSelectHour?: (point: HourlyForecastPoint) => void;
}

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  hourlyForecast,
  dailySummaries,
  onSelectHour
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'aqi' | 'pm25' | 'pm10' | 'ozone'>('aqi');
  const [selectedPoint, setSelectedPoint] = useState<HourlyForecastPoint | null>(
    hourlyForecast[0] || null
  );

  // Prepare chart dataset
  const chartData = hourlyForecast.map((p) => ({
    timeLabel: `${p.dayName} ${p.hour}:00`,
    hour: p.hour,
    dayName: p.dayName,
    aqi: p.aqi,
    aqiLower: p.aqiLower,
    aqiUpper: p.aqiUpper,
    uncertaintyRange: [p.aqiLower, p.aqiUpper],
    pm25: p.pm25,
    pm10: p.pm10,
    ozone: p.ozone,
    temp: p.temperature,
    wind: p.windSpeed,
    rawPoint: p
  }));

  const handlePointClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const pt: HourlyForecastPoint = data.activePayload[0].payload.rawPoint;
      setSelectedPoint(pt);
      if (onSelectHour) onSelectHour(pt);
    }
  };

  const currentSelection = selectedPoint || hourlyForecast[0];
  const activeCatInfo = currentSelection ? getCategoryInfo(currentSelection.aqi) : AQI_CATEGORIES.good;

  return (
    <div className="space-y-6">
      
      {/* 3-Day Daily Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1D4B59]" />
            <h3 className="text-xs font-black text-[#102B33] uppercase tracking-widest">
              3-Day Forecast Summary (Multi-Horizon Rollup)
            </h3>
          </div>
          <span className="text-[11px] text-[#517280] font-medium">
            Daily Aggregated Forecasts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dailySummaries.map((day) => {
            const cat = AQI_CATEGORIES[day.category];
            return (
              <div
                key={day.date}
                className="bg-white border border-[#CFDDE7] rounded-[24px] p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#E2ECF2] pb-3">
                    <div>
                      <span className="text-sm font-bold text-[#102B33]">
                        {day.dayName}
                      </span>
                      <span className="text-xs text-[#517280] ml-2 font-mono">
                        {day.formattedDate}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                      {cat.name}
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#517280] tracking-wider">Average AQI</span>
                      <div className="text-3xl font-black font-mono tracking-tight text-[#102B33]">
                        {day.avgAqi}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#517280] tracking-wider">Range</span>
                      <div className="text-xs font-bold text-[#102B33] font-mono">
                        {day.minAqi} - {day.maxAqi} AQI
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#517280] mt-3 line-clamp-2 leading-relaxed">
                    {day.advisory}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2ECF2] flex items-center justify-between text-[11px] text-[#517280]">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>{day.weatherSummary.tempMin}° / {day.weatherSummary.tempMax}°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Wind className="w-3.5 h-3.5 text-[#1D4B59]" />
                    <span>Avg {day.weatherSummary.windSpeedAvg} km/h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 72-Hour Interactive Forecast Timeline Chart */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1D4B59]" />
              <h3 className="text-sm font-black text-[#102B33] tracking-tight uppercase">
                72-Hour Atmospheric Trajectory & Predictive Range
              </h3>
            </div>
            <p className="text-xs text-[#517280] mt-1">
              Scrub along the curve to inspect hourly particulate variations, wind dispersion, and confidence bounds.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 bg-[#F0F5F8] p-1.5 rounded-2xl border border-[#CFDDE7] text-xs">
            <button
              onClick={() => setSelectedMetric('aqi')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedMetric === 'aqi'
                  ? 'bg-[#1D4B59] text-white shadow-sm'
                  : 'text-[#517280] hover:text-[#102B33]'
              }`}
            >
              AQI Index
            </button>
            <button
              onClick={() => setSelectedMetric('pm25')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedMetric === 'pm25'
                  ? 'bg-[#1D4B59] text-white shadow-sm'
                  : 'text-[#517280] hover:text-[#102B33]'
              }`}
            >
              PM2.5
            </button>
            <button
              onClick={() => setSelectedMetric('pm10')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedMetric === 'pm10'
                  ? 'bg-[#1D4B59] text-white shadow-sm'
                  : 'text-[#517280] hover:text-[#102B33]'
              }`}
            >
              PM10
            </button>
            <button
              onClick={() => setSelectedMetric('ozone')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                selectedMetric === 'ozone'
                  ? 'bg-[#1D4B59] text-white shadow-sm'
                  : 'text-[#517280] hover:text-[#102B33]'
              }`}
            >
              Ozone
            </button>
          </div>
        </div>

        {/* Recharts Forecast Graph */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              onClick={handlePointClick}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4B59" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1D4B59" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="uncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF2" vertical={false} />
              
              <XAxis 
                dataKey="timeLabel" 
                stroke="#517280" 
                fontSize={11}
                tickLine={false}
                interval={7}
              />
              
              <YAxis 
                stroke="#517280" 
                fontSize={11}
                tickLine={false}
                domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax * 1.15))]}
              />

              {/* EPA Threshold Guideline Lines */}
              {selectedMetric === 'aqi' && (
                <>
                  <ReferenceLine y={50} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'Good', fill: '#059669', fontSize: 10, position: 'insideTopLeft' }} />
                  <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'Moderate', fill: '#D97706', fontSize: 10, position: 'insideTopLeft' }} />
                  <ReferenceLine y={150} stroke="#F97316" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'Unhealthy (SG)', fill: '#EA580C', fontSize: 10, position: 'insideTopLeft' }} />
                  <ReferenceLine y={200} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'Unhealthy', fill: '#DC2626', fontSize: 10, position: 'insideTopLeft' }} />
                </>
              )}

              <Tooltip content={<CustomForecastTooltip metric={selectedMetric} />} />

              {/* 90% Confidence Uncertainty Range for AQI */}
              {selectedMetric === 'aqi' && (
                <Area
                  type="monotone"
                  dataKey="uncertaintyRange"
                  stroke="none"
                  fill="url(#uncertaintyGrad)"
                  name="90% Confidence Band"
                />
              )}

              {/* Main Metric Curve */}
              {selectedMetric === 'aqi' && (
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke="#1D4B59"
                  strokeWidth={2.5}
                  fill="url(#aqiGrad)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#1D4B59', stroke: '#FFFFFF', strokeWidth: 2 }}
                  name="Predicted AQI"
                />
              )}

              {selectedMetric === 'pm25' && (
                <Line
                  type="monotone"
                  dataKey="pm25"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: '#D97706' }}
                  name="PM2.5 Concentration"
                />
              )}

              {selectedMetric === 'pm10' && (
                <Line
                  type="monotone"
                  dataKey="pm10"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: '#0284C7' }}
                  name="PM10 Concentration"
                />
              )}

              {selectedMetric === 'ozone' && (
                <Line
                  type="monotone"
                  dataKey="ozone"
                  stroke="#9333EA"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: '#9333EA' }}
                  name="Ozone (O3)"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Hour Inspection Bar */}
        {currentSelection && (
          <div className="mt-5 pt-4 border-t border-[#E2ECF2] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F7FAFC] p-4 rounded-2xl border border-[#CFDDE7]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white text-[#102B33] flex items-center gap-2 border border-[#CFDDE7]">
                {currentSelection.isDay ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span className="text-xs font-bold font-mono">
                  {currentSelection.dayName} {currentSelection.hour}:00
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#517280]">Forecasted AQI:</span>
                  <span className="text-base font-black font-mono text-[#102B33]">
                    {currentSelection.aqi} AQI
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                    {activeCatInfo.name}
                  </span>
                </div>
                <div className="text-[11px] text-[#517280] font-mono">
                  90% Uncertainty Spread: {currentSelection.aqiLower} - {currentSelection.aqiUpper} AQI
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#102B33] font-mono">
              <div className="flex items-center gap-1">
                <span className="text-[#517280] font-sans">PM2.5:</span>
                <span className="font-bold text-amber-700">{currentSelection.pm25} µg/m³</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#517280] font-sans">Temp:</span>
                <span className="font-bold text-[#102B33]">{currentSelection.temperature}°C</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#517280] font-sans">Wind:</span>
                <span className="font-bold text-[#1D4B59]">{currentSelection.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#517280] font-sans">Humidity:</span>
                <span className="font-bold text-emerald-700">{currentSelection.humidity}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hourly Forecast Carousel / Reel */}
      <div className="bg-white border border-[#CFDDE7] rounded-[24px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-xs font-black uppercase tracking-widest text-[#102B33]">
            Hourly Prediction Scrubber (Next 24h)
          </span>
          <span className="text-[11px] text-[#517280] font-mono">Scroll horizontally →</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {hourlyForecast.slice(0, 24).map((pt, i) => {
            const cat = getCategoryInfo(pt.aqi);
            const isSelected = selectedPoint?.time === pt.time;
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedPoint(pt);
                  if (onSelectHour) onSelectHour(pt);
                }}
                className={`shrink-0 w-24 p-3 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'bg-[#1D4B59] text-white border-[#1D4B59] shadow-sm'
                    : 'bg-[#F7FAFC] border-[#CFDDE7] text-[#102B33] hover:border-[#1D4B59]'
                }`}
              >
                <span className={`text-[10px] font-mono block ${isSelected ? 'text-slate-200' : 'text-[#517280]'}`}>
                  {pt.dayName} {pt.hour}:00
                </span>
                <div className="text-xl font-black my-1 font-mono">
                  {pt.aqi}
                </div>
                <div className={`text-[10px] font-bold truncate font-mono ${isSelected ? 'text-slate-200' : 'text-[#517280]'}`}>
                  {pt.temperature}°C • {pt.windSpeed}k
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip for Forecast Chart
const CustomForecastTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: HourlyForecastPoint = payload[0].payload.rawPoint;
    const cat = getCategoryInfo(data.aqi);

    return (
      <div className="bg-white border border-[#CFDDE7] rounded-2xl p-4 shadow-xl text-xs text-[#102B33] min-w-[200px]">
        <div className="flex items-center justify-between border-b border-[#E2ECF2] pb-2 mb-2.5">
          <span className="font-bold text-[#102B33]">{label}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
            {cat.name}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#517280]">Predicted AQI:</span>
            <span className="font-bold text-[#1D4B59] font-mono">{data.aqi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#517280]">90% Range:</span>
            <span className="font-mono text-[#102B33]">{data.aqiLower} - {data.aqiUpper}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#517280]">PM2.5:</span>
            <span className="font-semibold text-amber-700 font-mono">{data.pm25} µg/m³</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#517280]">Temperature:</span>
            <span className="font-semibold text-[#102B33] font-mono">{data.temperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#517280]">Wind Speed:</span>
            <span className="font-semibold text-[#1D4B59] font-mono">{data.windSpeed} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#517280]">Humidity:</span>
            <span className="font-semibold text-emerald-700 font-mono">{data.humidity}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
