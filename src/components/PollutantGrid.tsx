import React from 'react';
import { PollutantData } from '../types/aqi';
import { AQI_CATEGORIES } from '../services/airQualityService';
import { Factory, Activity } from 'lucide-react';

interface PollutantGridProps {
  pollutants: PollutantData[];
}

export const PollutantGrid: React.FC<PollutantGridProps> = ({ pollutants }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1D4B59]" />
          <h3 className="text-xs font-black text-[#102B33] uppercase tracking-widest">
            Criteria Pollutants & Chemical Speciation (EPA Criteria 6)
          </h3>
        </div>
        <span className="text-[11px] text-[#517280] font-mono">
          WHO Standard Benchmarked
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pollutants.map((item) => {
          const catInfo = AQI_CATEGORIES[item.status];
          const ratio = item.value / item.standardLimit;

          return (
            <div
              key={item.code}
              className="bg-white border border-[#CFDDE7] rounded-[24px] p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Header: Name + Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-[#102B33] tracking-tight">
                        {item.code}
                      </span>
                      <span className="text-xs text-[#517280] font-medium truncate max-w-[130px]">
                        ({item.name.replace(/\(.*\)/, '').trim()})
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                    {item.aqiContribution} AQI
                  </span>
                </div>

                {/* Main Value */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight font-mono text-[#102B33]">
                    {item.value}
                  </span>
                  <span className="text-xs text-[#517280] font-mono">
                    {item.unit}
                  </span>
                  <span className="text-[11px] text-[#517280] ml-auto font-mono">
                    Limit: {item.standardLimit} {item.unit}
                  </span>
                </div>

                {/* Progress Bar vs Limit */}
                <div className="mt-2.5 w-full bg-[#EEF4F8] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, (ratio / 2.5) * 100))}%`,
                      backgroundColor: ratio > 1 ? '#e11d48' : '#1D4B59'
                    }}
                  />
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-[#517280] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Emission Sources */}
              <div className="mt-3.5 pt-3 border-t border-[#E2ECF2] flex items-center gap-2 text-[11px] text-[#517280]">
                <Factory className="w-3.5 h-3.5 text-[#517280] shrink-0" />
                <span className="truncate">
                  {item.sources.slice(0, 2).join(', ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
