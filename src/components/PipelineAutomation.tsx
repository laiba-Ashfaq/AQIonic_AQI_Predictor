import React, { useState } from 'react';
import { 
  GitBranch, 
  Cloud, 
  Database, 
  Cpu, 
  Smartphone, 
  ArrowRight, 
  Check, 
  Copy, 
  Clock, 
  Terminal, 
  FileCode, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CODE_TEMPLATES, CodeFile } from '../data/codeTemplates';
import { PipelineExecutionLog } from '../types/aqi';

interface PipelineAutomationProps {
  logs: PipelineExecutionLog[];
  defaultView?: 'architecture' | 'code';
}

export const PipelineAutomation: React.FC<PipelineAutomationProps> = ({
  logs,
  defaultView = 'architecture'
}) => {
  const [activeCodeFile, setActiveCodeFile] = useState<CodeFile>(CODE_TEMPLATES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCodeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Serverless Architecture Flowchart (Matching Slide 2) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              100% Serverless End-to-End MLOps Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Decoupled Feature Store, Model Registry, and Real-Time Prediction Serving Stack.
            </p>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
            Zero Dedicated Server Maintenance
          </span>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {/* Step 1: External API Telemetry */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between relative hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center border border-cyan-500/30 font-mono">
                1
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-400">Hourly Ingest</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Weather & AQI APIs</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Raw atmospheric readings (Open-Meteo & AQICN Copernicus sensors).
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-cyan-300 font-mono">
              → JSON Raw Telemetry
            </div>
          </div>

          {/* Step 2: Feature Engineering & Store */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between relative hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center border border-cyan-500/30 font-mono">
                2
              </span>
              <span className="text-[10px] uppercase font-mono text-cyan-400">Hopsworks FS</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Database className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Feature Store</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Transforms lag-24h, rolling means, sin/cos time stamps, and stores vectors.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-cyan-300 font-mono">
              → Features & Targets
            </div>
          </div>

          {/* Step 3: Model Training & Registry */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between relative hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30 font-mono">
                3
              </span>
              <span className="text-[10px] uppercase font-mono text-amber-400">Daily Retrain</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h4 className="text-xs font-bold text-white">Model Registry</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Trains Random Forest & XGBoost, tests RMSE, evaluates SHAP, and registers champion.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-amber-300 font-mono">
              → best_model.pkl
            </div>
          </div>

          {/* Step 4: Interactive Web Application */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between relative hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30 font-mono">
                4
              </span>
              <span className="text-[10px] uppercase font-mono text-indigo-400">React & API</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">Prediction App</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fetches latest feature vector, runs real-time inference, and renders 72h forecast.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-indigo-300 font-mono">
              → Real-time Dashboard
            </div>
          </div>

        </div>
      </div>

      {/* CI/CD Automation Schedule & Live Execution Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Schedule Specifications */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl backdrop-blur-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-3.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Automated CI/CD Cron Schedules
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between font-bold text-white mb-1">
                  <span>Feature Extraction Script</span>
                  <span className="font-mono text-cyan-400">0 * * * *</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Runs every hour via GitHub Actions / Apache Airflow to capture new sensor readings and append to Hopsworks.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <div className="flex justify-between font-bold text-white mb-1">
                  <span>ML Model Retraining</span>
                  <span className="font-mono text-cyan-400">0 2 * * *</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Runs every night at 02:00 UTC to evaluate model drift, train on 90-day rolling data, and deploy best artifacts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Terminal Execution Logs */}
        <div className="lg:col-span-8 bg-slate-950/90 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl font-mono text-xs backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-3.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">
                Serverless Pipeline Execution Terminal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
              <span className="text-[11px] text-cyan-400">Daemon Active</span>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] leading-relaxed">
                <div className="flex items-center justify-between text-slate-400 mb-0.5">
                  <span className="text-cyan-400 font-bold">[{log.stage.toUpperCase()}]</span>
                  <span className="text-[10px]">{log.timestamp} • {log.durationMs}ms</span>
                </div>
                <div className="text-slate-200">{log.message}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Production Python & CI/CD Scripts Exporter */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              Downloadable Production Scripts & Workflows
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ready-to-deploy Python scripts for Hopsworks Feature Store, Scikit-learn Training, GitHub Actions, and Streamlit.
            </p>
          </div>

          {/* File Selector */}
          <div className="flex items-center gap-2.5">
            <select
              value={activeCodeFile.filename}
              onChange={(e) => {
                const found = CODE_TEMPLATES.find(c => c.filename === e.target.value);
                if (found) setActiveCodeFile(found);
              }}
              aria-label="Select production script"
              className="bg-slate-800/90 text-xs text-slate-200 px-3.5 py-2 rounded-2xl border border-slate-700/60 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {CODE_TEMPLATES.map((c) => (
                <option key={c.filename} value={c.filename}>
                  {c.filename}
                </option>
              ))}
            </select>

            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl flex items-center gap-2 transition-colors shadow-md shadow-cyan-500/20"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Script Details */}
        <div className="mb-3 text-xs">
          <h4 className="font-bold text-white">{activeCodeFile.title}</h4>
          <p className="text-slate-400 mt-0.5">{activeCodeFile.description}</p>
        </div>

        {/* Code Box */}
        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-300 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
          <code>{activeCodeFile.code}</code>
        </pre>
      </div>

    </div>
  );
};
