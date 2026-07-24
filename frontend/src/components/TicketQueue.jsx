import React, { useState } from 'react';
import { Flame, Zap, Snowflake, Search, Filter, ArrowUpRight, Lock, Clock } from 'lucide-react';

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
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">SOLVED</span>;
      case 'ESCALATED':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-md">ESCALATED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">OPEN</span>;
    }
  };

  const getTierBadge = (tier) => {
    const isEnt = tier === 'enterprise';
    return (
      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
        isEnt ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}>
        {tier}
      </span>
    );
  };

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by subject, ID, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {['ALL', 'OPEN', 'SOLVED', 'ESCALATED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/60 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Swimlane Columns (Hot, Warm, Cold) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* HOT LANE */}
        <div className="minimal-card p-5 border-t-4 border-t-rose-500">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Hot Priority</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full">{hotTickets.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">P1 SLA: 15m</span>
          </div>

          <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
            {hotTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs italic">No hot priority tickets</div>
            ) : (
              hotTickets.map(t => (
                <TicketCard key={t.id} ticket={t} onSelect={() => onSelectTicket(t)} getStatusBadge={getStatusBadge} getTierBadge={getTierBadge} />
              ))
            )}
          </div>
        </div>

        {/* WARM LANE */}
        <div className="minimal-card p-5 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Warm Priority</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">{warmTickets.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">P2 SLA: 2h</span>
          </div>

          <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
            {warmTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs italic">No warm priority tickets</div>
            ) : (
              warmTickets.map(t => (
                <TicketCard key={t.id} ticket={t} onSelect={() => onSelectTicket(t)} getStatusBadge={getStatusBadge} getTierBadge={getTierBadge} />
              ))
            )}
          </div>
        </div>

        {/* COLD LANE */}
        <div className="minimal-card p-5 border-t-4 border-t-sky-500">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Cold Priority</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded-full">{coldTickets.length}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">P3 SLA: 24h</span>
          </div>

          <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
            {coldTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs italic">No cold priority tickets</div>
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
      className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-400 hover:shadow-md cursor-pointer transition group relative"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-xs text-slate-900 font-bold">{ticket.id}</span>
          {getTierBadge(ticket.customer_tier)}
        </div>
        {getStatusBadge(ticket.status)}
      </div>

      <h4 className="text-xs font-bold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-indigo-600 transition">
        {ticket.subject}
      </h4>

      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
        {ticket.pii_redacted_body || ticket.body}
      </p>

      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">{ticket.intent}</span>
          {ticket.pii_found && (
            <span className="flex items-center text-rose-600 font-bold" title="PII Redacted">
              <Lock className="w-3 h-3 mr-0.5" /> PII
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-slate-900 font-bold group-hover:translate-x-0.5 transition">
          <span>Inspect</span>
          <ArrowUpRight className="w-3 h-3 text-slate-700" />
        </div>
      </div>
    </div>
  );
}
