import React from 'react';
import { Search, Plus, RefreshCw, Activity, Database, Lock, Cpu } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onNewTicket, 
  apiOnline, 
  metrics,
  onRefresh 
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Top Navigation Pills (matching reference image top bar) */}
        <div className="flex items-center space-x-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm w-full md:w-auto">
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'triage'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Triage Operations
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'knowledge'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            OWASP Security
          </button>
        </div>

        {/* Right Status & Action Pills */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          
          <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-700 font-semibold text-xs">{apiOnline ? 'FastAPI Active' : 'Standalone Demo'}</span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 font-mono text-[11px] font-bold">{metrics.active_llm_provider || 'Gemini 2.5'}</span>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onNewTicket}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>

        </div>

      </div>
    </header>
  );
}
