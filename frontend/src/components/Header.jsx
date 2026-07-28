import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

const TABS = [
  { id: 'triage',    label: 'Triage Ops',      icon: '⚡' },
  { id: 'knowledge', label: 'Knowledge Base',  icon: '🧠' },
  { id: 'security',  label: 'Security',        icon: '🛡️' },
  { id: 'analytics', label: 'Analytics',       icon: '📊' },
  { id: 'kanban',    label: 'Kanban',          icon: '🗂️' },
];

export default function Header({ activeTab, setActiveTab, onNewTicket, apiOnline, onRefresh }) {
  return (
    <header className="mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Navigation Tab Pills */}
        <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-white/[0.04] border border-white/8 backdrop-blur-xl w-full md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-pill flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">

          {/* API Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/4 border border-white/8 backdrop-blur-xl text-xs">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-slate-300">{apiOnline ? 'FastAPI Active' : 'Demo Mode'}</span>
            <span className="text-white/20">|</span>
            <span className="font-mono text-[11px] font-bold text-slate-400">🏢 Acme Corp</span>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 rounded-xl bg-white/4 border border-white/8 text-slate-400 hover:text-slate-100 hover:bg-white/8 hover:border-indigo-500/30 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* New Ticket */}
          <button
            onClick={onNewTicket}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/25"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>

        </div>
      </div>
    </header>
  );
}
