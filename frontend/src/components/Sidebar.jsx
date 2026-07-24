import React from 'react';
import { LayoutDashboard, Database, ShieldCheck, Settings, HelpCircle, User, ChevronRight, Plus } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onNewTicket }) {
  const navItems = [
    { id: 'triage', label: 'Triage Ops', icon: LayoutDashboard },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'security', label: 'OWASP Security', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between p-4 bg-white border-r border-slate-200/80 min-h-screen">
      <div>
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 px-3 py-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <div className="w-3 h-3 rounded-full bg-white"></div>
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900">SentinelDesk</h1>
            <p className="text-[10px] text-slate-400 font-medium">Support Operations AI</p>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 mb-6 rounded-2xl bg-slate-100/70 border border-slate-200/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs">
              S
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Support Ops Admin</div>
              <div className="text-[10px] text-slate-400 font-medium">Enterprise Tier</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dashboard Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-slate-400' : 'text-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Quick Action */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onNewTicket}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* Footer / System Info */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-2">
          <span className="flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Help & Docs</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
