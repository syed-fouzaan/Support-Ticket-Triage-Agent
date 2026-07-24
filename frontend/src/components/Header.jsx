import React from 'react';
import { Shield, Sparkles, Plus, Database, Lock, Activity, RefreshCw } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onNewTicket, 
  apiOnline, 
  metrics,
  onRefresh 
}) {
  return (
    <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl shadow-indigo-950/20 border border-white/[0.08]">
        
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('triage')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-[#070A14] rounded-[10px] flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Sentinel<span className="gradient-text">Desk</span>
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
                Agentic v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Floating Nav Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setActiveTab('triage')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'triage'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Triage Ops</span>
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'knowledge'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>OWASP Audit</span>
          </button>
        </nav>

        {/* Actions & Status Pill */}
        <div className="flex items-center space-x-3">
          
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px]">{apiOnline ? 'API Active' : 'Standalone Mode'}</span>
            <span className="text-slate-600">·</span>
            <span className="gradient-text font-mono text-[11px] font-bold">{metrics.active_llm_provider || 'Gemini 2.5'}</span>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh System State"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition border border-transparent hover:border-white/[0.06]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onNewTicket}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>

        </div>

      </div>
    </header>
  );
}
