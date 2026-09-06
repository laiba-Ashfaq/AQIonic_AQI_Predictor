import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Heart, 
  Baby, 
  Activity, 
  Wind, 
  Bell, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { getCategoryInfo } from '../services/airQualityService';

interface HealthAlertsProps {
  currentAQI: number;
}

export const HealthAlerts: React.FC<HealthAlertsProps> = ({ currentAQI }) => {
  const [selectedGroup, setSelectedGroup] = useState<'asthma' | 'children' | 'elderly' | 'athletes' | 'general'>('asthma');
  const [alertThreshold, setAlertThreshold] = useState<number>(100);
  const [testAlertTriggered, setTestAlertTriggered] = useState(false);

  const currentCat = getCategoryInfo(currentAQI);
  const isTriggered = currentAQI >= alertThreshold;

  const triggerTestNotification = () => {
    setTestAlertTriggered(true);
    setTimeout(() => setTestAlertTriggered(false), 5000);
  };

  const vulnerableGroups = [
    {
      id: 'asthma',
      name: 'Asthma & Lung Conditions',
      icon: Activity,
      riskLevel: currentAQI > 50 ? 'High' : 'Low',
      guidance: 'Keep rapid-acting bronchodilator rescue inhalers immediately accessible. Avoid outdoor exertion if AQI exceeds 100.',
      maskRecommendation: currentAQI > 100 ? 'Certified N95 / FFP2 Mask Required' : 'Optional',
      actions: [
        'Pre-medicate before unavoidable outdoor transit',
        'Monitor peak expiratory flow (PEF) readings twice daily',
        'Remain in rooms with continuous HEPA filtration'
      ]
    },
    {
      id: 'children',
      name: 'Children & Pregnant Women',
      icon: Baby,
      riskLevel: currentAQI > 100 ? 'Severe' : 'Moderate',
      guidance: 'Children breathe more air per pound of body weight and their developing lungs are highly vulnerable to PM2.5 alveolar penetration.',
      maskRecommendation: currentAQI > 100 ? 'Child-Sized N95 / KF94 Respirator' : 'Not required',
      actions: [
        'Move physical education (PE) sports indoors',
        'Avoid playgrounds near major highways and bus terminals',
        'Keep home nursery windows tightly sealed'
      ]
    },
    {
      id: 'elderly',
      name: 'Seniors & Heart Disease',
      icon: Heart,
      riskLevel: currentAQI > 100 ? 'High' : 'Low',
      guidance: 'Fine particulate matter causes systemic vascular inflammation, increasing arrhythmia and coronary ischemia risks.',
      maskRecommendation: currentAQI > 150 ? 'N95 Respirator with Low Breathing Resistance' : 'Advised',
      actions: [
        'Take regular blood pressure and pulse readings',
        'Avoid strenuous snow shoveling or heavy lifting outdoors',
        'Stay in air-conditioned environments with carbon filters'
      ]
    },
    {
      id: 'athletes',
      name: 'Outdoor Athletes & Workers',
      icon: Wind,
      riskLevel: currentAQI > 100 ? 'High' : 'Low',
      guidance: 'Heavy exertion increases minute ventilation rate tenfold, driving high volumes of ultrafine particulate deep into airway passages.',
      maskRecommendation: currentAQI > 100 ? 'Respirator with Exhalation Valve' : 'None',
      actions: [
        'Reschedule intense workouts to early morning hours',
        'Reduce duration and intensity of outdoor training sessions',
        'Hydrate frequently to aid respiratory mucous clearance'
      ]
    }
  ];

  const activeGroupData = vulnerableGroups.find(g => g.id === selectedGroup) || vulnerableGroups[0];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-[#102B33] uppercase tracking-tight">
                Public Health Advisory & Hazardous Alert Center
              </h2>
            </div>
            <p className="text-xs text-[#517280] mt-1">
              Personalized health recommendations, demographic risk profiling, and threshold warning alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
              Current AQI: {currentAQI} ({currentCat.name})
            </span>
          </div>
        </div>

        {/* Real-time Status Card */}
        <div className="mt-5 p-4 rounded-2xl bg-[#F7FAFC] border border-[#CFDDE7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isTriggered ? (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            )}
            <div>
              <h4 className="text-xs font-bold text-[#102B33]">
                {isTriggered ? 'Threshold Advisory Active' : 'Normal Atmospheric Range'}
              </h4>
              <p className="text-xs text-[#517280] mt-0.5">
                Current location AQI ({currentAQI}) is {isTriggered ? 'above' : 'below'} your configured alert threshold ({alertThreshold} AQI).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={triggerTestNotification}
              className="px-3.5 py-2 text-xs font-bold bg-[#1D4B59] hover:bg-[#153843] text-white rounded-2xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Test Alert Trigger</span>
            </button>
          </div>
        </div>

        {testAlertTriggered && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center justify-between animate-bounce">
            <span>🚨 HAZARDOUS AQI ALERT: Air Quality Index reached {currentAQI}! Limit outdoor exposure immediately.</span>
          </div>
        )}
      </div>

      {/* Demographic Risk Selector & Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Demographic Cards */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#102B33]">
            Select Demographic Profile
          </h3>

          <div className="space-y-2.5">
            {vulnerableGroups.map((g) => {
              const Icon = g.icon;
              const isSelected = selectedGroup === g.id;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGroup(g.id as any)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1D4B59] text-white border-[#1D4B59] shadow-sm'
                      : 'bg-white text-[#102B33] border-[#CFDDE7] hover:border-[#1D4B59]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${isSelected ? 'bg-white/10 border-white/20 text-white' : 'bg-[#EEF4F8] border-[#D5E3EC] text-[#1D4B59]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{g.name}</div>
                      <div className={`text-[11px] ${isSelected ? 'text-slate-200' : 'text-[#517280]'}`}>
                        Risk: {g.riskLevel}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#EEF4F8] text-[#1D4B59]'
                  }`}>
                    View Advisory
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Guidance Panel */}
        <div className="lg:col-span-7 bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2ECF2] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                  <activeGroupData.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#102B33]">
                    {activeGroupData.name} Advisory
                  </h3>
                  <span className="text-xs text-[#517280]">
                    Specific Respiratory & Cardiovascular Precautions
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                Risk Level: {activeGroupData.riskLevel}
              </span>
            </div>

            {/* Guidance Content */}
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#102B33] uppercase tracking-wider mb-1">Medical Guidance</h4>
                <p className="text-xs text-[#517280] leading-relaxed">
                  {activeGroupData.guidance}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#102B33] uppercase tracking-wider mb-1">Mask / Respirator Standard</h4>
                <div className="p-3 rounded-2xl bg-[#F7FAFC] border border-[#CFDDE7] text-xs font-mono font-bold text-[#1D4B59]">
                  {activeGroupData.maskRecommendation}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#102B33] uppercase tracking-wider mb-2">Recommended Protective Actions</h4>
                <ul className="space-y-2">
                  {activeGroupData.actions.map((act, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#102B33]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2ECF2] flex items-center justify-between text-xs text-[#517280]">
            <span>Automated Health Warning System</span>
            <span className="font-mono font-bold text-[#1D4B59]">EPA 0-500 Scale Compliant</span>
          </div>
        </div>

      </div>

    </div>
  );
};
