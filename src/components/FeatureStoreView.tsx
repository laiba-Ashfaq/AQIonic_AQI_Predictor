import React, { useState } from 'react';
import { 
  Database, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Table, 
  FileCode, 
  Layers
} from 'lucide-react';
import { generateFeatureStoreMockRecords, INITIAL_PIPELINE_LOGS } from '../services/pipelineSimulator';
import { FeatureRecord, PipelineExecutionLog } from '../types/aqi';
import { PipelineAutomation } from './PipelineAutomation';

interface FeatureStoreViewProps {
  cityName: string;
}

export const FeatureStoreView: React.FC<FeatureStoreViewProps> = ({ cityName }) => {
  const [activeTab, setActiveTab] = useState<'records' | 'pipeline_flow' | 'scripts'>('records');
  const [records, setRecords] = useState<FeatureRecord[]>(() => generateFeatureStoreMockRecords(cityName));
  const [isRunningHourly, setIsRunningHourly] = useState(false);
  const [isRunningBackfill, setIsRunningBackfill] = useState(false);
  const [logs, setLogs] = useState<PipelineExecutionLog[]>(INITIAL_PIPELINE_LOGS);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleTriggerHourlyPipeline = () => {
    setIsRunningHourly(true);
    setStatusMessage('Executing feature_pipeline.py: Fetching raw telemetry & engineering time-series lags...');

    setTimeout(() => {
      const newRecs = generateFeatureStoreMockRecords(cityName);
      setRecords(newRecs);
      
      const newLog: PipelineExecutionLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        stage: 'feature_store_write',
        status: 'success',
        message: `Successfully executed hourly pipeline for ${cityName}. Synced 24 records to Feature Group: "aqi_meteorology_features" (v1).`,
        durationMs: 460
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRunningHourly(false);
      setStatusMessage('Hourly pipeline executed successfully! Feature store updated.');
      setTimeout(() => setStatusMessage(null), 4000);
    }, 1500);
  };

  const handleTriggerBackfill = () => {
    setIsRunningBackfill(true);
    setStatusMessage('Executing backfill.py: Generating 90-day past historical observations and target labels...');

    setTimeout(() => {
      const newLog: PipelineExecutionLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        stage: 'data_ingestion',
        status: 'success',
        message: `Historical backfill completed: 2,160 hourly records (90 days) ingested and stored into Feature Store.`,
        durationMs: 1840
      };
      setLogs(prev => [newLog, ...prev]);
      setIsRunningBackfill(false);
      setStatusMessage('Historical 90-day backfill completed successfully!');
      setTimeout(() => setStatusMessage(null), 4000);
    }, 2200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#EEF4F8] text-[#1D4B59] border border-[#D5E3EC]">
                <Database className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-[#102B33] uppercase tracking-tight">
                Serverless Feature Store & Automated Ingestion Architecture
              </h2>
            </div>
            <p className="text-xs text-[#517280] mt-1">
              Centralized feature group containing engineered atmospheric lags, rolling statistics, and multi-horizon target labels.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-bold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Feature Store Active (Local & Cloud Sync)
            </span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="mt-5 pt-4 border-t border-[#E2ECF2] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#517280]">
            <Layers className="w-4 h-4 text-[#1D4B59]" />
            <span>Feature Group: <strong className="text-[#102B33]">aqi_meteorology_features_v1</strong></span>
            <span>•</span>
            <span>Primary Keys: <strong className="text-[#102B33]">city, event_timestamp</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTriggerHourlyPipeline}
              disabled={isRunningHourly || isRunningBackfill}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#1D4B59] hover:bg-[#153843] text-white flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningHourly ? 'animate-spin' : ''}`} />
              <span>{isRunningHourly ? 'Running Pipeline...' : 'Run Hourly Pipeline'}</span>
            </button>

            <button
              onClick={handleTriggerBackfill}
              disabled={isRunningHourly || isRunningBackfill}
              className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#EEF4F8] hover:bg-[#D5E3EC] text-[#102B33] border border-[#D5E3EC] flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 text-[#1D4B59] ${isRunningBackfill ? 'animate-spin' : ''}`} />
              <span>{isRunningBackfill ? 'Backfilling Data...' : 'Historical Backfill (90d)'}</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3 p-3 rounded-2xl bg-[#EEF4F8] border border-[#D5E3EC] text-xs text-[#1D4B59] font-mono flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#CFDDE7] pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
            activeTab === 'records'
              ? 'bg-[#1D4B59] text-white shadow-sm'
              : 'bg-white text-[#517280] hover:text-[#102B33] border border-[#CFDDE7]'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Feature Store Table View ({records.length} Records)</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline_flow')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
            activeTab === 'pipeline_flow'
              ? 'bg-[#1D4B59] text-white shadow-sm'
              : 'bg-white text-[#517280] hover:text-[#102B33] border border-[#CFDDE7]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>CI/CD Pipeline Flow & Logs</span>
        </button>
      </div>

      {/* TAB 1: Feature Group Table View */}
      {activeTab === 'records' && (
        <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[#E2ECF2] text-[#517280] bg-[#F7FAFC]">
                  <th className="py-3 px-3 font-semibold">City</th>
                  <th className="py-3 px-3 font-semibold">Time</th>
                  <th className="py-3 px-3 font-semibold text-right">PM2.5 (µg)</th>
                  <th className="py-3 px-3 font-semibold text-right">PM10 (µg)</th>
                  <th className="py-3 px-3 font-semibold text-right">US AQI</th>
                  <th className="py-3 px-3 font-semibold text-right">PM2.5 Lag 1h</th>
                  <th className="py-3 px-3 font-semibold text-right">PM2.5 Lag 24h</th>
                  <th className="py-3 px-3 font-semibold text-right">Roll Mean 6h</th>
                  <th className="py-3 px-3 font-semibold text-right">Target 24h</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2ECF2] text-[#102B33]">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-[#F7FAFC] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#1D4B59]">{r.city}</td>
                    <td className="py-2.5 px-3 text-[#517280]">{r.timestamp}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-700">{r.pm25}</td>
                    <td className="py-2.5 px-3 text-right text-sky-700">{r.pm10}</td>
                    <td className="py-2.5 px-3 text-right font-black text-[#102B33]">{r.usAqi}</td>
                    <td className="py-2.5 px-3 text-right text-[#517280]">{r.pm25_lag_1h}</td>
                    <td className="py-2.5 px-3 text-right text-[#517280]">{r.pm25_lag_24h}</td>
                    <td className="py-2.5 px-3 text-right text-[#517280]">{r.pm25_rolling_mean_6h}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#1D4B59]">{r.target_aqi_next_24h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CI/CD Automation View */}
      {activeTab === 'pipeline_flow' && (
        <PipelineAutomation logs={logs} />
      )}

    </div>
  );
};
