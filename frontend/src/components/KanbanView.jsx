import React, { useState, useEffect, useCallback } from 'react';

const URGENCY_COLORS = {
  HOT: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300', dot: 'bg-rose-500' },
  WARM: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', dot: 'bg-amber-400' },
  COLD: { bg: 'bg-sky-500/20', border: 'border-sky-500/40', text: 'text-sky-300', dot: 'bg-sky-400' },
};

const COLUMNS = [
  { id: 'OPEN', label: 'Open', icon: '🔴', desc: 'Awaiting Triage' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: '🟡', desc: 'Agent Processing' },
  { id: 'RESOLVED', label: 'Resolved', icon: '🟢', desc: 'Autonomous / Human' },
];

function TicketCard({ ticket, onDragStart }) {
  const urgency = ticket.urgency || 'COLD';
  const colors = URGENCY_COLORS[urgency] || URGENCY_COLORS.COLD;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id)}
      className={`p-3 rounded-lg border ${colors.bg} ${colors.border} cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 group`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] text-slate-400">{ticket.id}</span>
        <span className={`flex items-center gap-1 text-[10px] font-bold ${colors.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`}></span>
          {urgency}
        </span>
      </div>
      <p className="text-xs font-semibold text-slate-100 leading-tight line-clamp-2">{ticket.subject}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{ticket.customer_name || 'Customer'}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">{ticket.intent || 'Unknown'}</span>
      </div>
      {ticket.confidence && (
        <div className="mt-2 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
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
      const status = t.status || 'OPEN';
      if (grouped[status]) grouped[status].push(t);
      else grouped['OPEN'].push(t);
    });
    setColumns(grouped);
  }, [tickets]);

  const handleDragStart = useCallback((e, ticketId) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback((e, targetColId) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    setColumns((prev) => {
      const updated = { ...prev };
      let movedTicket = null;
      // Remove from source column
      for (const colId of Object.keys(updated)) {
        const idx = updated[colId].findIndex((t) => t.id === ticketId);
        if (idx !== -1) {
          [movedTicket] = updated[colId].splice(idx, 1);
          break;
        }
      }
      if (movedTicket) {
        movedTicket = { ...movedTicket, status: targetColId };
        updated[targetColId] = [movedTicket, ...updated[targetColId]];
        onTicketMove?.(movedTicket);
      }
      return updated;
    });
    setDragOverCol(null);
  }, [onTicketMove]);

  const handleDragOver = useCallback((e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center space-x-2">
            <span>🗂️</span>
            <span>Live Ticket Priority Kanban Board</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Drag & drop tickets between lanes · Changes sync to triage engine</p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {Object.values(columns).flat().length} total tickets
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 min-h-[60vh]">
        {COLUMNS.map((col) => {
          const colTickets = columns[col.id] || [];
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-xl border transition-all ${
                isOver
                  ? 'border-indigo-500/60 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.icon}</span>
                  <div>
                    <p className="text-xs font-extrabold text-slate-100">{col.label}</p>
                    <p className="text-[10px] text-slate-500">{col.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {colTickets.length}
                </span>
              </div>

              {/* Ticket Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[65vh]">
                {colTickets.length === 0 ? (
                  <div className={`flex items-center justify-center h-20 text-xs text-slate-600 border-2 border-dashed rounded-lg transition-all ${isOver ? 'border-indigo-500/40 text-indigo-400' : 'border-slate-800'}`}>
                    {isOver ? '↓ Drop here' : 'No tickets'}
                  </div>
                ) : (
                  colTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onDragStart={handleDragStart}
                    />
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
