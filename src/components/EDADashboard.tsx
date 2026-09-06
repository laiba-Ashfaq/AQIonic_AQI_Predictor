import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  BarChart2, 
  Grid, 
  BoxSelect, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const EDADashboard: React.FC = () => {
  const [selectedChart, setSelectedChart] = useState<'line' | 'histogram' | 'heatmap' | 'boxplot'>('line');

  // 1. Line Chart Dataset: 24-Hour Continuous AQI & PM2.5 Trend Over Time
  const lineChartData = [
    { time: '00:00', aqi: 75, pm25: 28, temp: 22, wind: 6.2 },
    { time: '02:00', aqi: 78, pm25: 30, temp: 20, wind: 5.8 },
    { time: '04:00', aqi: 82, pm25: 32, temp: 19, wind: 5.4 },
    { time: '06:00', aqi: 95, pm25: 38, temp: 21, wind: 5.6 },
    { time: '08:00', aqi: 142, pm25: 58, temp: 25, wind: 6.8 }, // Morning traffic peak
    { time: '10:00', aqi: 128, pm25: 49, temp: 28, wind: 8.4 },
    { time: '12:00', aqi: 110, pm25: 41, temp: 31, wind: 11.2 },
    { time: '14:00', aqi: 115, pm25: 39, temp: 33, wind: 13.5 },
    { time: '16:00', aqi: 122, pm25: 44, temp: 32, wind: 12.0 },
    { time: '18:00', aqi: 155, pm25: 64, temp: 29, wind: 8.5 }, // Evening rush hour
    { time: '20:00', aqi: 172, pm25: 75, temp: 26, wind: 6.0 }, // Inversion boundary collapse
    { time: '22:00', aqi: 138, pm25: 54, temp: 24, wind: 5.5 }
  ];

  // 2. Histogram Dataset: Distribution of PM2.5 readings (Bins: 0-10, 10-20, etc.)
  const histogramData = [
    { bin: '0-15', count: 120, label: 'Good (0-15 µg/m³)' },
    { bin: '15-35', count: 280, label: 'Moderate (15-35 µg/m³)' },
    { bin: '35-55', count: 450, label: 'USG (35-55 µg/m³)' }, // Peak frequency
    { bin: '55-75', count: 310, label: 'Unhealthy (55-75 µg/m³)' },
    { bin: '75-110', count: 180, label: 'Very Unhealthy (75-110 µg/m³)' },
    { bin: '110-150', count: 95, label: 'Hazardous (110-150 µg/m³)' },
    { bin: '150+', count: 42, label: 'Severe Emergency (>150 µg/m³)' }
  ];

  // 3. Heatmap Dataset: Pollutant Co-movement Matrix (Correlation values -1 to +1)
  const heatmapVariables = ['PM2.5', 'PM10', 'NO2', 'O3', 'SO2', 'Temp', 'Wind'];
  const correlationMatrix = [
    [1.00, 0.92, 0.78, 0.35, 0.62, -0.42, -0.68], // PM2.5
    [0.92, 1.00, 0.71, 0.28, 0.58, -0.38, -0.62], // PM10
    [0.78, 0.71, 1.00, 0.42, 0.65, -0.30, -0.55], // NO2
    [0.35, 0.28, 0.42, 1.00, 0.22,  0.82, -0.15], // O3 (High solar temp correlation)
    [0.62, 0.58, 0.65, 0.22, 1.00, -0.25, -0.48], // SO2
    [-0.42,-0.38,-0.30, 0.82,-0.25,  1.00,  0.45], // Temp
    [-0.68,-0.62,-0.55,-0.15,-0.48,  0.45,  1.00]  // Wind (Strong negative correlation with PM)
  ];

  // Helper function to colorize correlation cells
  const getHeatmapBg = (val: number) => {
    if (val === 1) return 'bg-[#1D4B59] text-white font-bold';
    if (val >= 0.7) return 'bg-[#2A6677] text-white';
    if (val >= 0.4) return 'bg-[#5194A6] text-white';
    if (val >= 0.1) return 'bg-[#89BFCE] text-[#102B33]';
    if (val >= -0.3) return 'bg-[#D3E5EC] text-[#102B33]';
    if (val >= -0.6) return 'bg-[#B0D2DE] text-[#102B33]';
    return 'bg-[#76AEC1] text-white font-medium';
  };

  // 4. Box Plot Dataset: Outlier & Distribution Metrics for Key Monitoring Locations
  const boxPlotData = [
    { city: 'Islamabad', min: 18, q1: 35, median: 52, q3: 78, max: 110, outliers: [142, 165] },
    { city: 'Karachi', min: 42, q1: 75, median: 112, q3: 148, max: 195, outliers: [235] },
    { city: 'Lahore', min: 85, q1: 145, median: 198, q3: 260, max: 340, outliers: [420, 475] }, // High inversion outliers
    { city: 'Multan', min: 60, q1: 105, median: 152, q3: 210, max: 285, outliers: [350] },
    { city: 'Faisalabad', min: 70, q1: 120, median: 175, q3: 230, max: 310, outliers: [390] }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-6">
      
      {/* Title & Subtitle - Exact reference match */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-[#1D4B59] tracking-tight">
          Data visualization & EDA
        </h1>
        <p className="text-sm font-medium italic text-slate-600">
          Not decoration — it's how you find patterns, outliers, and errors before you ever trust a model.
        </p>
      </div>

      {/* 4 EDA Visualization Feature Cards Grid (Matching reference picture layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Line Chart */}
        <div 
          onClick={() => setSelectedChart('line')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between h-56 ${
            selectedChart === 'line'
              ? 'bg-[#E3EFE9] border-[#A8CEBC] ring-2 ring-[#1D4B59]/20 shadow-md'
              : 'bg-[#EBF3EF] border-[#D1E4DA] hover:border-[#B2D6C4] hover:shadow-sm'
          }`}
        >
          {/* Mini Line Preview */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs h-28 flex items-center justify-center">
            <svg viewBox="0 0 200 80" className="w-full h-full text-[#1D4B59] stroke-current stroke-[2.5] fill-none">
              <polyline points="10,50 45,30 75,45 115,18 160,28 190,32" />
              <circle cx="10" cy="50" r="3" className="fill-[#1D4B59]" />
              <circle cx="45" cy="30" r="3" className="fill-[#1D4B59]" />
              <circle cx="75" cy="45" r="3" className="fill-[#1D4B59]" />
              <circle cx="115" cy="18" r="3.5" className="fill-[#1D4B59]" />
              <circle cx="160" cy="28" r="3" className="fill-[#1D4B59]" />
              <circle cx="190" cy="32" r="3" className="fill-[#1D4B59]" />
            </svg>
          </div>

          <div className="text-center mt-3">
            <h3 className="text-base font-bold text-[#102B33]">Line chart</h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">AQI trend over time</p>
          </div>
        </div>

        {/* Card 2: Histogram */}
        <div 
          onClick={() => setSelectedChart('histogram')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between h-56 ${
            selectedChart === 'histogram'
              ? 'bg-[#E3EFE9] border-[#A8CEBC] ring-2 ring-[#1D4B59]/20 shadow-md'
              : 'bg-[#EBF3EF] border-[#D1E4DA] hover:border-[#B2D6C4] hover:shadow-sm'
          }`}
        >
          {/* Mini Histogram Preview */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs h-28 flex items-end justify-center gap-1.5 px-4">
            <div className="w-5 bg-[#1B5E46] rounded-t-sm" style={{ height: '35%' }} />
            <div className="w-5 bg-[#1B5E46] rounded-t-sm" style={{ height: '60%' }} />
            <div className="w-5 bg-[#1B5E46] rounded-t-sm" style={{ height: '90%' }} />
            <div className="w-5 bg-[#1B5E46] rounded-t-sm" style={{ height: '55%' }} />
            <div className="w-5 bg-[#1B5E46] rounded-t-sm" style={{ height: '25%' }} />
          </div>

          <div className="text-center mt-3">
            <h3 className="text-base font-bold text-[#102B33]">Histogram</h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Distribution of PM2.5 readings</p>
          </div>
        </div>

        {/* Card 3: Heatmap */}
        <div 
          onClick={() => setSelectedChart('heatmap')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between h-56 ${
            selectedChart === 'heatmap'
              ? 'bg-[#E3EFE9] border-[#A8CEBC] ring-2 ring-[#1D4B59]/20 shadow-md'
              : 'bg-[#EBF3EF] border-[#D1E4DA] hover:border-[#B2D6C4] hover:shadow-sm'
          }`}
        >
          {/* Mini Heatmap Grid Preview */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs h-28 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-1 w-full max-w-[130px]">
              <div className="h-4 bg-[#B0D2DE] rounded-xs" />
              <div className="h-4 bg-[#5194A6] rounded-xs" />
              <div className="h-4 bg-[#2A6677] rounded-xs" />
              <div className="h-4 bg-[#D3E5EC] rounded-xs" />
              <div className="h-4 bg-[#5194A6] rounded-xs" />
              <div className="h-4 bg-[#1D4B59] rounded-xs" />
              <div className="h-4 bg-[#2A6677] rounded-xs" />
              <div className="h-4 bg-[#89BFCE] rounded-xs" />
              <div className="h-4 bg-[#89BFCE] rounded-xs" />
              <div className="h-4 bg-[#2A6677] rounded-xs" />
              <div className="h-4 bg-[#1D4B59] rounded-xs" />
              <div className="h-4 bg-[#3B82F6] rounded-xs" />
            </div>
          </div>

          <div className="text-center mt-3">
            <h3 className="text-base font-bold text-[#102B33]">Heatmap</h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Which pollutants move together</p>
          </div>
        </div>

        {/* Card 4: Box Plot */}
        <div 
          onClick={() => setSelectedChart('boxplot')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between h-56 ${
            selectedChart === 'boxplot'
              ? 'bg-[#E3EFE9] border-[#A8CEBC] ring-2 ring-[#1D4B59]/20 shadow-md'
              : 'bg-[#EBF3EF] border-[#D1E4DA] hover:border-[#B2D6C4] hover:shadow-sm'
          }`}
        >
          {/* Mini Box Plot Preview */}
          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs h-28 flex items-center justify-center relative">
            <div className="w-16 h-12 border-2 border-[#1D4B59] relative flex flex-col justify-between bg-emerald-50/40">
              <div className="w-full h-0.5 bg-[#1D4B59] my-auto" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#1D4B59]" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#1D4B59]" />
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 border border-amber-600" />
            </div>
          </div>

          <div className="text-center mt-3">
            <h3 className="text-base font-bold text-[#102B33]">Box plot</h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">Spotting outliers & sensor errors</p>
          </div>
        </div>

      </div>

      {/* Interactive Detail Chart Renderer for the Selected EDA Category */}
      <div className="bg-white border border-[#CFDDE7] rounded-[24px] p-6 shadow-sm space-y-5">
        
        {/* Active Selection Header */}
        <div className="flex items-center justify-between border-b border-[#E2ECF2] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF4F8] border border-[#CFDDE7] flex items-center justify-center text-[#1D4B59]">
              {selectedChart === 'line' && <TrendingUp className="w-5 h-5" />}
              {selectedChart === 'histogram' && <BarChart2 className="w-5 h-5" />}
              {selectedChart === 'heatmap' && <Grid className="w-5 h-5" />}
              {selectedChart === 'boxplot' && <BoxSelect className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#102B33]">
                {selectedChart === 'line' && 'AQI & Pollutant Temporal Trend Analysis'}
                {selectedChart === 'histogram' && 'PM2.5 Frequency Distribution & Skewness'}
                {selectedChart === 'heatmap' && 'Multi-Pollutant Correlation Heatmap Matrix'}
                {selectedChart === 'boxplot' && 'Regional AQI Dispersion & Anomaly Outlier Detection'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {selectedChart === 'line' && 'Examines 24-hour diurnal commuter peaks, photochemical ozone shifts, and nocturnal inversions.'}
                {selectedChart === 'histogram' && 'Log-normal distribution breakdown highlighting modal concentrations across historical sensor telemetry.'}
                {selectedChart === 'heatmap' && 'Pearson correlation coefficients showing atmospheric coupling between PM2.5, PM10, NO2, O3, and weather.'}
                {selectedChart === 'boxplot' && 'Box-and-whisker metrics showing median (Q2), interquartile range (IQR), and sensor spike anomalies.'}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#F0F5F8] p-1 rounded-xl border border-[#CFDDE7] text-xs font-semibold">
            {(['line', 'histogram', 'heatmap', 'boxplot'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedChart(type)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  selectedChart === type
                    ? 'bg-[#1D4B59] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#102B33]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 1. LINE CHART INTERACTIVE DETAILED VIEW */}
        {selectedChart === 'line' && (
          <div className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF2" vertical={false} />
                  <XAxis dataKey="time" stroke="#517280" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#517280" fontSize={11} fontWeight={600} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CFDDE7', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="aqi" stroke="#1D4B59" strokeWidth={3.5} name="AQI Index" dot={{ r: 4, fill: '#1D4B59' }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="pm25" stroke="#D97706" strokeWidth={2.5} name="PM2.5 Concentration (µg/m³)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="wind" stroke="#2563EB" strokeWidth={2} strokeDasharray="4 4" name="Wind Speed (km/h)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="bg-[#F8FAFC] border border-slate-200 p-3.5 rounded-xl">
                <span className="font-bold text-[#102B33] block mb-1">Morning Peak (08:00 AM)</span>
                <span className="text-slate-600">AQI reaches 142 during peak vehicular rush hour combined with low solar mixing.</span>
              </div>
              <div className="bg-[#F8FAFC] border border-slate-200 p-3.5 rounded-xl">
                <span className="font-bold text-[#102B33] block mb-1">Afternoon Ventilation (02:00 PM)</span>
                <span className="text-slate-600">Thermal updrafts and 13.5 km/h surface wind temporarily lower surface PM2.5 to 39 µg/m³.</span>
              </div>
              <div className="bg-[#F8FAFC] border border-slate-200 p-3.5 rounded-xl">
                <span className="font-bold text-[#102B33] block mb-1">Night Inversion Spike (08:00 PM)</span>
                <span className="text-slate-600">Nocturnal boundary layer collapse traps emissions near surface, driving peak AQI to 172.</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. HISTOGRAM INTERACTIVE DETAILED VIEW */}
        {selectedChart === 'histogram' && (
          <div className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2ECF2" vertical={false} />
                  <XAxis dataKey="bin" stroke="#517280" fontSize={11} fontWeight={600} />
                  <YAxis stroke="#517280" fontSize={11} fontWeight={600} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CFDDE7', borderRadius: '12px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#1B5E46" radius={[8, 8, 0, 0]} name="Sample Reading Count">
                    {histogramData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#1D4B59' : '#2D7263'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#F0F7F4] border border-[#C6E2D5] p-4 rounded-xl text-xs text-[#133D2E] flex items-start gap-3">
              <Info className="w-5 h-5 text-[#1B5E46] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm mb-0.5">Histogram Insights: Modal Class & Log-Normal Right Skew</span>
                The sensor distribution demonstrates a pronounced right-skewed log-normal distribution. 30.6% of readings fall into the 35–55 µg/m³ modal bracket, indicating chronic ambient background pollution in urban industrial corridors.
              </div>
            </div>
          </div>
        )}

        {/* 3. HEATMAP INTERACTIVE DETAILED VIEW */}
        {selectedChart === 'heatmap' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-2.5 text-left font-bold text-[#102B33] border-b border-slate-200">Variable</th>
                    {heatmapVariables.map((v) => (
                      <th key={v} className="p-2.5 font-bold text-[#102B33] border-b border-slate-200">{v}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapVariables.map((rowVar, rIdx) => (
                    <tr key={rowVar} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2.5 text-left font-bold text-[#102B33] bg-slate-50">{rowVar}</td>
                      {correlationMatrix[rIdx].map((val, cIdx) => (
                        <td key={cIdx} className="p-1">
                          <div className={`p-2 rounded-lg font-mono transition-all ${getHeatmapBg(val)}`}>
                            {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#F0F5F8] border border-[#CFDDE7] p-3.5 rounded-xl">
                <span className="font-bold text-[#1D4B59] block mb-1">Strong Positive Coupling: PM2.5 & PM10 (+0.92)</span>
                High co-linear correlation confirms common combustion sources and wind-blown dust entrainment.
              </div>
              <div className="bg-[#F0F5F8] border border-[#CFDDE7] p-3.5 rounded-xl">
                <span className="font-bold text-rose-800 block mb-1">Strong Negative Dispersion: PM2.5 & Wind (-0.68)</span>
                Surface wind velocity is the single strongest physical clearing mechanism for urban particulate concentration.
              </div>
            </div>
          </div>
        )}

        {/* 4. BOX PLOT INTERACTIVE DETAILED VIEW */}
        {selectedChart === 'boxplot' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {boxPlotData.map((item) => (
                <div key={item.city} className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#102B33]">{item.city}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">IQR: {item.q3 - item.q1}</span>
                  </div>

                  {/* Vertical Box Plot Representation */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 h-40 flex items-center justify-center relative">
                    <div className="w-12 border-2 border-[#1D4B59] bg-emerald-50 rounded-sm relative flex flex-col justify-between py-2 h-28">
                      <div className="text-[9px] font-mono font-bold text-center text-[#1D4B59]">{item.q3}</div>
                      <div className="w-full h-0.5 bg-[#1D4B59]" />
                      <div className="text-[9px] font-mono font-bold text-center text-emerald-800">Q2: {item.median}</div>
                      <div className="w-full h-0.5 bg-[#1D4B59]" />
                      <div className="text-[9px] font-mono font-bold text-center text-[#1D4B59]">{item.q1}</div>
                      
                      {/* Whisker Lines */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#1D4B59]" />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#1D4B59]" />
                    </div>

                    {/* Outlier Dots */}
                    {item.outliers.map((out, idx) => (
                      <div 
                        key={idx}
                        title={`Flagged Sensor Outlier Spike: AQI ${out}`}
                        className="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose-500 border border-rose-700 animate-pulse cursor-pointer"
                      />
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div className="flex justify-between"><span>Min - Max:</span><span className="font-mono">{item.min} - {item.max}</span></div>
                    <div className="flex justify-between font-bold text-[#102B33]"><span>Median:</span><span className="font-mono">{item.median}</span></div>
                    <div className="flex justify-between text-rose-700 font-medium"><span>Outliers Flagged:</span><span>{item.outliers.length} spikes</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Sensor Outlier Validation:</span> Extreme spikes flagged above 1.5× IQR (e.g. Lahore 475 AQI spike) represent crop stubble burning episodes verified against MODIS thermal satellite telemetry.
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Text - Exact reference match */}
      <div className="pt-2 text-center">
        <p className="text-xs text-slate-500 italic max-w-3xl mx-auto">
          This is the "why" behind the EDA step in your project brief — and it's also how you communicate findings to non-technical stakeholders.
        </p>
      </div>

    </div>
  );
};
