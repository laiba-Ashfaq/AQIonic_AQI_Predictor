import React, { useState } from 'react';
import { getCategoryInfo } from '../services/airQualityService';

interface AQIGaugeProps {
  aqi: number;
  size?: number;
}

interface SegmentInfo {
  name: string;
  rangeLabel: string;
  color: string;
  start: number;
  end: number;
  description: string;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({ aqi, size = 280 }) => {
  const categoryInfo = getCategoryInfo(aqi);
  const [hoveredSeg, setHoveredSeg] = useState<SegmentInfo | null>(null);

  // Clamp AQI between 0 and 500
  const clampedAqi = Math.max(0, Math.min(500, aqi));
  
  // Angle mapped from -180 to 0 degrees (semi-circle)
  const angle = -180 + (clampedAqi / 500) * 180;
  
  const radius = size * 0.38;
  const strokeWidth = size * 0.08;
  const center = size / 2;

  // Arc segments based on EPA thresholds with Light-Theme aligned colors
  const segments: SegmentInfo[] = [
    { name: 'Good', rangeLabel: '0 – 50 AQI', color: '#059669', start: 0, end: 50, description: 'Satistfactory air quality; little or no health risk.' },
    { name: 'Moderate', rangeLabel: '51 – 100 AQI', color: '#D97706', start: 50, end: 100, description: 'Acceptable air quality; minor concern for sensitive people.' },
    { name: 'Unhealthy for Sensitive Groups', rangeLabel: '101 – 150 AQI', color: '#EA580C', start: 100, end: 150, description: 'Sensitive groups may experience health effects.' },
    { name: 'Unhealthy', rangeLabel: '151 – 200 AQI', color: '#DC2626', start: 150, end: 200, description: 'Everyone may begin to experience health effects.' },
    { name: 'Very Unhealthy', rangeLabel: '201 – 300 AQI', color: '#9333EA', start: 200, end: 300, description: 'Health alert: Increased risk for the entire populace.' },
    { name: 'Hazardous', rangeLabel: '301 – 500 AQI', color: '#9F1239', start: 300, end: 500, description: 'Health warning of emergency conditions.' },
  ];

  // Helper to describe an SVG arc
  const describeArc = (startVal: number, endVal: number) => {
    const startAngle = Math.PI - (startVal / 500) * Math.PI;
    const endAngle = Math.PI - (endVal / 500) * Math.PI;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center - radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center - radius * Math.sin(endAngle);

    return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      
      {/* Segment Hover Popover Tooltip */}
      {hoveredSeg && (
        <div className="absolute -top-12 z-30 bg-[#1D4B59] text-white px-3.5 py-2 rounded-2xl shadow-xl text-xs font-sans text-center max-w-[260px] animate-fade-in border border-sky-300/30">
          <div className="font-bold flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredSeg.color }} />
            <span>{hoveredSeg.name} ({hoveredSeg.rangeLabel})</span>
          </div>
          <p className="text-[10px] text-slate-200 mt-0.5 leading-tight">{hoveredSeg.description}</p>
        </div>
      )}

      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
        {/* Background Arc Track */}
        <path
          d={describeArc(0, 500)}
          fill="none"
          stroke="#DCE6EE"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Interactive Colored Arc Segments */}
        {segments.map((seg, idx) => {
          const isHovered = hoveredSeg?.name === seg.name;
          return (
            <path
              key={idx}
              d={describeArc(seg.start, seg.end)}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? strokeWidth * 1.25 : strokeWidth}
              strokeOpacity={hoveredSeg && !isHovered ? 0.4 : 1.0}
              strokeLinecap="butt"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSeg(seg)}
              onMouseLeave={() => setHoveredSeg(null)}
            />
          );
        })}

        {/* Pointer Needle matching Light Petrol Theme */}
        <g
          transform={`rotate(${angle + 90}, ${center}, ${center})`}
          className="transition-transform duration-700 ease-out pointer-events-none"
        >
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - radius * 0.88}
            stroke="#1D4B59"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx={center} cy={center} r="7" fill="#1D4B59" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx={center} cy={center - radius * 0.88} r="3" fill={categoryInfo.color} />
        </g>

        {/* Scale labels */}
        <text x={center - radius - strokeWidth / 2} y={center + 16} fill="#517280" fontSize="10" fontWeight="bold" textAnchor="middle">
          0
        </text>
        <text x={center} y={center - radius - strokeWidth - 2} fill="#517280" fontSize="10" fontWeight="bold" textAnchor="middle">
          250
        </text>
        <text x={center + radius + strokeWidth / 2} y={center + 16} fill="#517280" fontSize="10" fontWeight="bold" textAnchor="middle">
          500
        </text>
      </svg>

      {/* Main AQI Value, Subtitle, & Category Status Badge (Unified Container - Zero Overlap) */}
      <div className="absolute top-[40%] flex flex-col items-center text-center pointer-events-none space-y-1">
        <span
          className="text-4xl font-extrabold tracking-tight leading-none"
          style={{ color: categoryInfo.color }}
        >
          {aqi}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#517280]">
          US EPA AQI
        </span>
        <span
          className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${categoryInfo.badgeBg}`}
        >
          {categoryInfo.name}
        </span>
      </div>

      {/* Interactive Color Legend explaining what each arc segment represents */}
      <div className="mt-4 pt-3 border-t border-[#E2ECF2] w-full max-w-[340px]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#517280] text-center mb-2">
          AQI Scale Color Key (Hover any segment for details)
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-medium font-sans">
          {segments.map((seg, i) => {
            const isHovered = hoveredSeg?.name === seg.name;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredSeg(seg)}
                onMouseLeave={() => setHoveredSeg(null)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl cursor-pointer transition-all border ${
                  isHovered
                    ? 'bg-[#EEF4F8] border-[#1D4B59] font-bold text-[#102B33]'
                    : 'bg-[#F7FAFC] border-[#CFDDE7] text-[#517280] hover:border-[#1D4B59]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="truncate">{seg.name.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
