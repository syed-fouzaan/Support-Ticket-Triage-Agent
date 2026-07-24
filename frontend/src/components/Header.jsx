import React from 'react';
import { Shield, Zap, Plus, Database, Lock, Activity, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onNewTicket, 
  apiOnline, 
  metrics,
  onRefresh 
}) {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 bg-[#0B0F19]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('triage')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">Sentinel<span className="text-indigo-400">Desk</span></span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full">v1.0 Agentic</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Multi-Agent Support Triage Platform</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('triage')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'triage'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Triage Ops</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'knowledge'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Knowledge Base</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>OWASP Security</span>
            </button>
          </nav>

          {/* Right Action & System Status */}
          <div className="flex items-center space-x-3">
            
            {/* System Readiness Pill */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <div className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
              <span className="text-slate-300 font-medium">{apiOnline ? 'FastAPI Active' : 'Offline / Standalone'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-indigo-400 font-mono text-[11px]">{metrics.active_llm_provider || 'Gemini 2.5'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              title="Refresh Data"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Submit Ticket Button */}
            <button
              onClick={onNewTicket}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
