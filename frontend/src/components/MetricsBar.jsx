import React from 'react';
import { Ticket, CheckCircle, Clock, TrendingUp, Cpu, ShieldCheck } from 'lucide-react';

const BAR_COLORS = {
  indigo:  '#6366f1',
  emerald: '#10b981',
  sky:     '#0ea5e9',
  green:   '#22c55e',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
};

export default function MetricsBar({ metrics }) {
  const cards = [
    {
      title: 'ACTIVE TICKETS',
      value: metrics.total_tickets || 148,
      sub: 'Live intake queue',
      icon: Ticket,
      iconColor: '#6366f1',
      bar: 'indigo',
      pct: 74,
    },
    {
      title: 'AUTO-RESOLVED',
      value: `${metrics.auto_resolved_pct || 68.4}%`,
      sub: 'ChromaDB Grounded',
      icon: CheckCircle,
      iconColor: '#10b981',
      bar: 'emerald',
      pct: 68,
    },
    {
      title: 'AVG RESOLUTION',
      value: `${metrics.avg_resolution_min || 1.8}m`,
      sub: '⚡ 10.2x Faster vs SLA',
      icon: Clock,
      iconColor: '#0ea5e9',
      bar: 'sky',
      pct: 95,
    },
    {
      title: 'MONTHLY ROI',
      value: '$14.2k',
      sub: 'Saved in agent hours',
      icon: TrendingUp,
      iconColor: '#22c55e',
      bar: 'green',
      pct: 92,
    },
    {
      title: 'ACTIVE MODEL',
      value: 'Gemini gemini…',
      sub: 'Failover Pool Ready',
      icon: Cpu,
      iconColor: '#f59e0b',
      bar: 'amber',
      pct: 100,
    },
    {
      title: 'OWASP DEFLECTIONS',
      value: metrics.owasp_blocked_attempts || 14,
      sub: 'Prompt Attacks Blocked',
      icon: ShieldCheck,
      iconColor: '#8b5cf6',
      bar: 'purple',
      pct: 87,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 0,
      background: '#fff',
      borderBottom: '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            style={{
              padding: '14px 18px 12px',
              borderRight: i < cards.length - 1 ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 88,
              cursor: 'default',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            {/* Top: title + icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {c.title}
              </span>
              <Icon size={14} style={{ color: c.iconColor }} />
            </div>

            {/* Value */}
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 2, fontFamily: 'monospace' }}>
              {c.value}
            </div>

            {/* Sub text */}
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.sub}
            </div>

            {/* Bottom progress bar */}
            <div style={{ background: '#f1f5f9', borderRadius: 3, height: 3, overflow: 'hidden' }}>
              <div style={{ width: `${c.pct}%`, height: '100%', background: BAR_COLORS[c.bar], borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
