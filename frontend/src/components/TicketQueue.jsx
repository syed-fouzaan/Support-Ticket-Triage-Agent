import React, { useState } from 'react';
import { Flame, Zap, Snowflake, Search, Filter, ShieldAlert, ArrowUpRight, CheckCircle2, Lock } from 'lucide-react';

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
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md">SOLVED</span>;
      case 'ESCALATED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-md">ESCALATED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-md">OPEN</span>;
    }
  };

  const getTierBadge = (tier) => {
    const isEnt = tier === 'enterprise';
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
        isEnt ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
      }`}>
        {tier}
      </span>
    );
  };

  return (
    <div>
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 glass-panel p-4 rounded-2xl">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by subject, ID, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          {['ALL', 'OPEN', 'SOLVED', 'ESCALATED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Urgency Swimlanes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* HOT LANE */}
        <div className="glass-panel p-5 rounded-2xl border-t-4 border-t-rose-500">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Hot Priority</h3>
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-400 rounded-full">{hotTickets.length}</span>
            </div>
            <span className="text-[11px] text-slate-400">P1 SLA: 15m</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
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
        <div className="glass-panel p-5 rounded-2xl border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Warm Priority</h3>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-full">{warmTickets.length}</span>
            </div>
            <span className="text-[11px] text-slate-400">P2 SLA: 2h</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
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
        <div className="glass-panel p-5 rounded-2xl border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Snowflake className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Cold Priority</h3>
              <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full">{coldTickets.length}</span>
            </div>
            <span className="text-[11px] text-slate-400">P3 SLA: 24h</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
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
      className="glass-card p-4 rounded-xl cursor-pointer group hover:border-indigo-500/50 relative"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs text-indigo-400 font-semibold">{ticket.id}</span>
          {getTierBadge(ticket.customer_tier)}
        </div>
        {getStatusBadge(ticket.status)}
      </div>

      <h4 className="text-xs font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition">
        {ticket.subject}
      </h4>

      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
        {ticket.pii_redacted_body || ticket.body}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-slate-300">{ticket.intent}</span>
          {ticket.pii_found && (
            <span className="flex items-center text-rose-400" title="PII Redacted">
              <Lock className="w-3 h-3 mr-0.5" /> PII
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-indigo-400 font-medium group-hover:translate-x-0.5 transition">
          <span>Inspect</span>
          <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
