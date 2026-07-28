import React, { useState, useEffect, useCallback } from 'react';

const URGENCY_CONFIG = {
  HOT:  { dot: '#f56565', badge: '#f56565', cardBg: '#4a3040', cardBorder: '#744244' },
  WARM: { dot: '#ed8936', badge: '#ed8936', cardBg: '#3d4028', cardBorder: '#6b5e2e' },
  COLD: { dot: '#63b3ed', badge: '#63b3ed', cardBg: '#2d3f5c', cardBorder: '#3d5278' },
};

const COLUMNS = [
  { id: 'OPEN',        label: 'Open',        dot: '#f56565', desc: 'Awaiting Triage' },
  { id: 'IN_PROGRESS', label: 'In Progress',  dot: '#f6e05e', desc: 'Agent Processing' },
  { id: 'RESOLVED',    label: 'Resolved',     dot: '#68d391', desc: 'Autonomous / Human' },
];

function TicketCard({ ticket, onDragStart }) {
  const urgency = ticket.urgency || 'COLD';
  const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.COLD;
  const confidencePct = Math.round((ticket.confidence || 0.85) * 100);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, ticket.id)}
      style={{
        background: cfg.cardBg,
        border: `1px solid ${cfg.cardBorder}`,
        borderRadius: 9,
        padding: '12px 14px',
        marginBottom: 10,
        cursor: 'grab',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Top Row: ID + urgency badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#a0aec0' }}>{ticket.id}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: cfg.badge, fontSize: 10, fontWeight: 700 }}>
          🔴 {urgency}
        </span>
      </div>

      {/* Subject */}
      <p style={{ color: '#f7fafc', fontSize: 12, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.4 }}>
        {ticket.subject}
      </p>

      {/* Customer + Intent badge row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#718096', fontSize: 10 }}>{ticket.customer_name || 'Customer'}</span>
        <span style={{
          background: '#2d3748', color: '#e2e8f0', fontSize: 10, fontWeight: 600,
          borderRadius: 5, padding: '2px 7px',
        }}>
          {ticket.intent || 'Billing'}
        </span>
      </div>

      {/* Confidence bar */}
      <div style={{ background: '#2d3748', borderRadius: 3, height: 4, overflow: 'hidden' }}>
        <div style={{ width: `${confidencePct}%`, height: '100%', background: '#68d391', borderRadius: 3 }} />
      </div>
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
      else grouped.OPEN.push(t);
    });
    setColumns(grouped);
  }, [tickets]);

  const handleDragStart = useCallback((e, ticketId) => {
    e.dataTransfer.setData('ticketId', ticketId);
  }, []);

  const handleDrop = useCallback((e, targetColId) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    setColumns((prev) => {
      const updated = { ...prev, [targetColId]: [...prev[targetColId]] };
      let movedTicket = null;
      for (const colId of Object.keys(updated)) {
        const idx = updated[colId].findIndex((t) => t.id === ticketId);
        if (idx !== -1) {
          updated[colId] = [...updated[colId]];
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

  const totalCount = Object.values(columns).flat().length;

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100%' }}>

      {/* Sub-header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
        <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
          Drag &amp; drop tickets between lanes · Changes sync to triage engine
        </p>
        <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>{totalCount} total tickets</span>
      </div>

      {/* Kanban columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {COLUMNS.map((col) => {
          const colTickets = columns[col.id] || [];
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                background: isOver ? '#2d3f5c' : '#2d3748',
                borderRadius: 12,
                padding: 0,
                minHeight: 500,
                border: isOver ? '2px solid #63b3ed' : '2px solid transparent',
                transition: 'border 0.2s, background 0.2s',
                overflow: 'hidden',
              }}
            >
              {/* Column header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #4a5568' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.dot, display: 'inline-block', boxShadow: `0 0 6px ${col.dot}` }} />
                    <div>
                      <p style={{ color: '#f7fafc', fontWeight: 800, fontSize: 13, margin: 0 }}>{col.label}</p>
                      <p style={{ color: '#718096', fontSize: 10, margin: 0 }}>{col.desc}</p>
                    </div>
                  </div>
                  <span style={{
                    background: '#4a5568', color: '#f7fafc', borderRadius: '50%',
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                  }}>
                    {colTickets.length}
                  </span>
                </div>
              </div>

              {/* Cards area */}
              <div style={{ padding: '12px 12px', maxHeight: 520, overflowY: 'auto' }}>
                {colTickets.length === 0 ? (
                  <div style={{
                    border: '2px dashed #4a5568', borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 80, color: isOver ? '#63b3ed' : '#718096', fontSize: 12,
                    fontWeight: 500,
                  }}>
                    {isOver ? '↓ Drop here' : 'No tickets'}
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
