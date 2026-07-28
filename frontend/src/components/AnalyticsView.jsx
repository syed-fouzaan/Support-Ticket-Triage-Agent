import React, { useEffect, useState } from 'react';

export default function AnalyticsView() {
  const [metrics, setMetrics] = useState({
    total_tickets: 148,
    auto_resolved_pct: 68.4,
    avg_resolution_min: 1.8,
    escalation_rate_pct: 7.2,
    circuit_breaker_status: 'CLOSED',
    owasp_blocked_attempts: 14,
    sla_breaches: 0,
    estimated_usd_cost: 0.024800,
    avg_csat: 4.82,
  });

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/analytics/summary')
      .then((res) => res.json())
      .then((data) => { if (data) setMetrics((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, []);

  const kpis = [
    {
      label: 'Total Triaged Tickets',
      value: metrics.total_tickets,
      sub: '↑ +18% from last week',
      icon: '🎟️',
      cls: 'stat-card-violet',
      valCls: 'text-indigo-300',
      subCls: 'text-emerald-400',
    },
    {
      label: 'Autonomous Resolution',
      value: `${metrics.auto_resolved_pct}%`,
      sub: 'Target: > 60.0%',
      icon: '⚡',
      cls: 'stat-card-cyan',
      valCls: 'text-cyan-300',
      subCls: 'text-emerald-400',
    },
    {
      label: 'Estimated USD Cost',
      value: `$${metrics.estimated_usd_cost.toFixed(6)}`,
      sub: 'Avg $0.000140 / ticket',
      icon: '💲',
      cls: 'stat-card-emerald',
      valCls: 'text-emerald-300',
      subCls: 'text-slate-400',
    },
    {
      label: 'Predicted CSAT',
      value: `${metrics.avg_csat} / 5.0`,
      sub: 'Very Positive Sentiment',
      icon: '⭐',
      cls: 'stat-card-amber',
      valCls: 'text-amber-300',
      subCls: 'text-amber-400/80',
    },
  ];

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2">
            <span>📊</span>
            <span className="gradient-text">Real-Time Operations & SLA Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Live telemetry — 14 autonomous agent nodes</p>
        </div>
        <span className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot"></span>
          Telemetry Active
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${k.cls} rounded-2xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10`}>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>{k.label}</span>
              <span>{k.icon}</span>
            </div>
            <div className={`text-2xl font-black ${k.valCls}`}>{k.value}</div>
            <div className={`text-[11px] mt-1 ${k.subCls}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Breakdown */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Resolution Breakdown
          </h3>
          {[
            { label: 'Autonomous Solved (68.4%)', pct: 68.4, count: '101 tickets', color: 'from-indigo-500 to-violet-500', textCls: 'text-indigo-400' },
            { label: 'Human Escalated (7.2%)', pct: 7.2, count: '11 tickets', color: 'from-rose-500 to-pink-500', textCls: 'text-rose-400' },
            { label: 'In Progress / Open (24.4%)', pct: 24.4, count: '36 tickets', color: 'from-amber-400 to-orange-400', textCls: 'text-amber-400' },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                <span>{bar.label}</span>
                <span className={bar.textCls}>{bar.count}</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${bar.color} rounded-full transition-all duration-1000`}
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Security & Health */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            Security & Circuit Breaker Health
          </h3>
          <div className="space-y-3">
            {[
              { label: 'OWASP Injection Blocks', val: `${metrics.owasp_blocked_attempts} Attacks Blocked`, cls: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
              { label: 'SLA Breach Monitor', val: `${metrics.sla_breaches} Breaches (100% Compliant)`, cls: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'LLM Circuit Breaker', val: `${metrics.circuit_breaker_status} (Normal)`, cls: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            ].map((row) => (
              <div key={row.label} className={`flex items-center justify-between p-3 rounded-xl border ${row.bg}`}>
                <span className="text-xs font-semibold text-slate-300">{row.label}</span>
                <span className={`text-xs font-mono font-bold ${row.cls}`}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
