import React, { useState } from 'react';
import { Flame, Zap, Snowflake, Search, Filter, ArrowUpRight, Lock } from 'lucide-react';

export default function TicketQueue({ tickets, onSelectTicket }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || 
                          t.id.toLowerCase().includes(search.toLowerCase()) ||
                          t.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const hotTickets = filteredTickets.filter(t => t.urgency === 'HOT');
  const warmTickets = filteredTickets.filter(t => t.urgency === 'WARM');
  const coldTickets = filteredTickets.filter(t => t.urgency === 'COLD');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SOLVED':
        return <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 rounded-md">SOLVED</span>;
      case 'ESCALATED':
        return <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/25 rounded-md">ESCALATED</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 rounded-md">OPEN</span>;
    }
  };

  const getTierBadge = (tier) => {
    const isEnt = tier === 'enterprise';
    return (
      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${
        isEnt ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
      }`}>
        {tier}
      </span>
    );
  };

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 glass-panel p-3.5 rounded-2xl border border-white/[0.08]">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by subject, ID, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {['ALL', 'OPEN', 'SOLVED', 'ESCALATED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Swimlane Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* HOT LANE */}
        <div className="glass-panel p-4.5 rounded-2xl border-t-2 border-t-rose-500/80">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Hot Priority</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 rounded-full">{hotTickets.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">P1 SLA: 15m</span>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {hotTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No hot priority tickets</div>
            ) : (
              hotTickets.map(t => (
                <TicketCard key={t.id} ticket={t} onSelect={() => onSelectTicket(t)} getStatusBadge={getStatusBadge} getTierBadge={getTierBadge} />
              ))
            )}
          </div>
        </div>

        {/* WARM LANE */}
        <div className="glass-panel p-4.5 rounded-2xl border-t-2 border-t-amber-500/80">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Warm Priority</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded-full">{warmTickets.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">P2 SLA: 2h</span>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {warmTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No warm priority tickets</div>
            ) : (
              warmTickets.map(t => (
                <TicketCard key={t.id} ticket={t} onSelect={() => onSelectTicket(t)} getStatusBadge={getStatusBadge} getTierBadge={getTierBadge} />
              ))
            )}
          </div>
        </div>

        {/* COLD LANE */}
        <div className="glass-panel p-4.5 rounded-2xl border-t-2 border-t-cyan-500/80">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs text-white uppercase tracking-wider">Cold Priority</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded-full">{coldTickets.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">P3 SLA: 24h</span>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {coldTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No cold priority tickets</div>
            ) : (
              coldTickets.map(t => (
                <TicketCard key={t.id} ticket={t} onSelect={() => onSelectTicket(t)} getStatusBadge={getStatusBadge} getTierBadge={getTierBadge} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function TicketCard({ ticket, onSelect, getStatusBadge, getTierBadge }) {
  return (
    <div 
      onClick={onSelect}
      className="glass-card p-4 rounded-xl cursor-pointer group hover:border-indigo-500/40 relative"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs text-indigo-300 font-bold">{ticket.id}</span>
          {getTierBadge(ticket.customer_tier)}
        </div>
        {getStatusBadge(ticket.status)}
      </div>

      <h4 className="text-xs font-bold text-white mb-1.5 line-clamp-2 group-hover:text-indigo-300 transition">
        {ticket.subject}
      </h4>

      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        {ticket.pii_redacted_body || ticket.body}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 font-mono">
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]">{ticket.intent}</span>
          {ticket.pii_found && (
            <span className="flex items-center text-rose-400" title="PII Redacted">
              <Lock className="w-3 h-3 mr-0.5" /> PII
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-indigo-400 font-semibold group-hover:translate-x-0.5 transition">
          <span>Inspect</span>
          <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
