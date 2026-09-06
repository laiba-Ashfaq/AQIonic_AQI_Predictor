import React, { useState } from 'react';
import { ML_MODELS } from '../services/airQualityService';
import { 
  Cpu, 
  CheckCircle2, 
  Award, 
  Sliders, 
  Timer, 
  BarChart2, 
  Layers
} from 'lucide-react';

interface ModelZooProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelZoo: React.FC<ModelZooProps> = ({
  selectedModelId,
  onSelectModel
}) => {
  const [activeModelId, setActiveModelId] = useState<string>(selectedModelId || 'random_forest');

  const selectedModel = ML_MODELS.find(m => m.id === activeModelId) || ML_MODELS[0];

  const handleApplyModel = (modelId: string) => {
    setActiveModelId(modelId);
    onSelectModel(modelId);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                <Cpu className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-[#102B33] uppercase tracking-tight">
                ML Model Registry & Architecture Zoo (Scikit-Learn & Deep Learning)
              </h2>
            </div>
            <p className="text-xs text-[#517280] mt-1">
              Multi-model training and evaluation engine. Compare RMSE, MAE, R², inference latencies, non-negativity guarantees, and baseline persistence checks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Non-Negative AQI Guarantee (AQI ≥ 0)
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC] flex items-center gap-1.5 font-bold font-mono">
              <Award className="w-3.5 h-3.5 text-[#1D4B59]" />
              Champion: Stacking Ensemble (R² 0.856 | RMSE 17.6)
            </span>
          </div>
        </div>

        {/* Baseline Persistence Model Comparison Card */}
        <div className="mt-5 p-4 rounded-2xl bg-[#FFF8EE] border border-[#FFE6C7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#FFE6C7] text-amber-900 font-mono text-xs font-black">
              BASELINE
            </span>
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                Naïve Persistence Baseline Model Check (AQI(t+24) = AQI(t))
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Benchmark requirement: Evaluates whether ML models genuinely beat simple 24-hour persistence lag repeating today's AQI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs text-right">
            <div>
              <span className="text-[10px] text-amber-800/80 block uppercase font-sans font-semibold">Persistence RMSE</span>
              <span className="font-black text-amber-900">34.20</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-800/80 block uppercase font-sans font-semibold">ML Champion RMSE</span>
              <span className="font-black text-emerald-700">17.60</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              +48.5% Better
            </div>
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ML_MODELS.map((model) => {
          const isSelected = activeModelId === model.id;
          const isChampion = model.id === 'stacking_ensemble';

          return (
            <div
              key={model.id}
              onClick={() => handleApplyModel(model.id)}
              className={`bg-white border rounded-[24px] p-6 shadow-sm cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'border-[#1D4B59] ring-2 ring-[#1D4B59]/20 shadow-md'
                  : 'border-[#CFDDE7] hover:border-[#9BB3C4]'
              }`}
            >
              {isChampion && (
                <div className="absolute top-0 right-0 bg-[#1D4B59] text-white text-[10px] font-black px-3 py-1 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Production Champion
                </div>
              )}

              <div>
                <div className="flex items-center justify-between pr-14">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#517280]">
                    {model.type.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base font-black text-[#102B33] mt-1.5">
                  {model.name}
                </h3>

                <p className="text-xs text-[#517280] mt-2 line-clamp-2 leading-relaxed">
                  {model.description}
                </p>

                {/* Primary Metrics Strip */}
                <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#F7FAFC] border border-[#CFDDE7] text-center font-mono">
                  <div>
                    <span className="text-[10px] text-[#517280] uppercase font-mono">RMSE</span>
                    <div className="text-sm font-black text-[#1D4B59]">{model.rmse}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#517280] uppercase font-mono">MAE</span>
                    <div className="text-sm font-black text-emerald-700">{model.mae}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#517280] uppercase font-mono">R² Score</span>
                    <div className="text-sm font-black text-indigo-700">{model.r2}</div>
                  </div>
                </div>
              </div>

              {/* Footer Specs & Activation Status */}
              <div className="mt-5 pt-3.5 border-t border-[#E2ECF2] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] text-[#517280] font-mono">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3 text-[#517280]" />
                    {model.inferenceTimeMs}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#517280]" />
                    {model.featuresUsed} feats
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApplyModel(model.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#1D4B59] text-white shadow-sm'
                      : 'bg-[#EEF4F8] text-[#102B33] hover:bg-[#D5E3EC]'
                  }`}
                >
                  {isSelected ? 'Active Model' : 'Select'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Model Deep Dive & Hyperparameter Inspector */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2ECF2] pb-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#EEF4F8] border border-[#D5E3EC] text-[#1D4B59]">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#102B33]">
                  {selectedModel.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                  Feature Store Registry v2.4
                </span>
              </div>
              <p className="text-xs text-[#517280] mt-1">
                {selectedModel.bestFor}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#517280]">Training Speed:</span>
            <span className="font-mono text-xs font-bold text-amber-700">
              {selectedModel.trainingTimeMs} ms
            </span>
          </div>
        </div>

        {/* Hyperparameter Table & Tuning Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Hyperparameters */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#102B33] mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1D4B59]" />
              Active Hyperparameter Configuration
            </h4>
            <div className="bg-[#F7FAFC] rounded-2xl border border-[#CFDDE7] divide-y divide-[#E2ECF2] text-xs">
              {Object.entries(selectedModel.hyperparameters).map(([key, val]) => (
                <div key={key} className="p-3.5 flex justify-between items-center">
                  <span className="font-mono text-[#517280]">{key}</span>
                  <span className="font-mono font-bold text-[#1D4B59]">{String(val)}</span>
                </div>
              ))}
              <div className="p-3.5 flex justify-between items-center">
                <span className="font-mono text-[#517280]">Cross Validation Strategy</span>
                <span className="font-mono font-bold text-[#102B33]">5-Fold TimeSeriesSplit (Purged)</span>
              </div>
            </div>
          </div>

          {/* Training Evaluation Breakdown */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#102B33] mb-3 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1D4B59]" />
              Validation Error Metrics Breakdown
            </h4>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-[#CFDDE7]">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#102B33] font-bold">R² Goodness-of-Fit ({selectedModel.r2.toFixed(3)})</span>
                  <span className="font-mono text-[#1D4B59] font-bold">Target: &gt; 0.700</span>
                </div>
                <div className="w-full bg-[#E2ECF2] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#1D4B59] rounded-full"
                    style={{ width: `${Math.min(100, selectedModel.r2 * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-[#CFDDE7]">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#102B33] font-bold">Root Mean Squared Error (RMSE: {selectedModel.rmse})</span>
                  <span className="font-mono text-emerald-700 font-bold">Target: &lt; 25.0 AQI</span>
                </div>
                <div className="w-full bg-[#E2ECF2] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${Math.max(10, 100 - (selectedModel.rmse / 35) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-[#CFDDE7]">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[#102B33] font-bold">Mean Absolute Percentage Error (MAPE: {selectedModel.mape}%)</span>
                  <span className="font-mono text-indigo-700 font-bold">Target: &lt; 15%</span>
                </div>
                <div className="w-full bg-[#E2ECF2] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.max(10, 100 - selectedModel.mape * 3.5)}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
