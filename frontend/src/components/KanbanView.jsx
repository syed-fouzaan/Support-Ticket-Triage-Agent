import React, { useState, useEffect, useCallback } from 'react';

const URGENCY_STYLES = {
  HOT:  { grad: 'from-rose-500/20 to-pink-500/10', border: 'border-rose-500/30', dot: 'bg-rose-500', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
  WARM: { grad: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  COLD: { grad: 'from-sky-500/15 to-indigo-500/10', border: 'border-sky-500/25', dot: 'bg-sky-400', text: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300' },
};

const COLUMNS = [
  { id: 'OPEN', label: 'Open', desc: 'Awaiting Triage', accent: 'from-rose-500 to-orange-500', bg: 'bg-rose-500/8' },
  { id: 'IN_PROGRESS', label: 'In Progress', desc: 'Agent Processing', accent: 'from-amber-400 to-yellow-400', bg: 'bg-amber-500/8' },
  { id: 'RESOLVED', label: 'Resolved', desc: 'Autonomous / Human', accent: 'from-emerald-400 to-teal-400', bg: 'bg-emerald-500/8' },
];

function TicketCard({ ticket, onDragStart }) {
  const s = URGENCY_STYLES[ticket.urgency] || URGENCY_STYLES.COLD;
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id)}
      className={`p-3.5 rounded-xl border bg-gradient-to-br ${s.grad} ${s.border} cursor-grab active:cursor-grabbing active:scale-95 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 group`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] text-slate-500">{ticket.id}</span>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`}></span>
          {ticket.urgency || 'COLD'}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2">{ticket.subject}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500 truncate">{ticket.customer_name || 'Customer'}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-slate-400 font-mono whitespace-nowrap">{ticket.intent || 'Unknown'}</span>
      </div>
      {ticket.confidence != null && (
        <div className="mt-2 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            style={{ width: `${Math.round(ticket.confidence * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function KanbanView({ tickets = [], onTicketMove }) {
  const [columns, setColumns] = useState({ OPEN: [], IN_PROGRESS: [], RESOLVED: [] });
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => {
    const grouped = { OPEN: [], IN_PROGRESS: [], RESOLVED: [] };
    tickets.forEach((t) => {
      const s = t.status || 'OPEN';
      if (grouped[s]) grouped[s].push(t);
      else grouped['OPEN'].push(t);
    });
    setColumns(grouped);
  }, [tickets]);

  const handleDragStart = useCallback((e, id) => {
    e.dataTransfer.setData('ticketId', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e, targetCol) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('ticketId');
    setColumns((prev) => {
      const next = { ...prev };
      let moved = null;
      for (const col of Object.keys(next)) {
        const idx = next[col].findIndex((t) => t.id === id);
        if (idx !== -1) { [moved] = next[col].splice(idx, 1); break; }
      }
      if (moved) {
        moved = { ...moved, status: targetCol };
        next[targetCol] = [moved, ...next[targetCol]];
        onTicketMove?.(moved);
      }
      return next;
    });
    setDragOverCol(null);
  }, [onTicketMove]);

  const total = Object.values(columns).flat().length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <span>🗂️</span>
            <span className="gradient-text">Live Priority Kanban Board</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Drag & drop to re-prioritize · Changes sync to triage engine</p>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-white/5 border border-white/8 px-3 py-1 rounded-full">
          {total} tickets
        </span>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-4 min-h-[60vh]">
        {COLUMNS.map((col) => {
          const colTickets = columns[col.id] || [];
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 ${
                isOver
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                  : 'border-white/6'
              } bg-white/[0.02]`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-r ${col.accent}`}></span>
                      <p className="text-sm font-extrabold text-slate-100">{col.label}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{col.desc}</p>
                  </div>
                  <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${col.accent} text-white shadow-md`}>
                    {colTickets.length}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-3 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${col.accent} rounded-full transition-all duration-700`}
                    style={{ width: total > 0 ? `${(colTickets.length / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[62vh]">
                {colTickets.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-24 text-xs text-slate-600 border-2 border-dashed rounded-xl transition-all ${
                    isOver ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' : 'border-white/8'
                  }`}>
                    {isOver ? (
                      <><span className="text-2xl mb-1">↓</span><span>Drop here</span></>
                    ) : (
                      <><span className="text-2xl mb-1 opacity-30">📭</span><span>No tickets</span></>
                    )}
                  </div>
                ) : (
                  colTickets.map((t) => (
                    <TicketCard key={t.id} ticket={t} onDragStart={handleDragStart} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
