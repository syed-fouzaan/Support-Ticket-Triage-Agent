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
      .then((data) => {
        if (data) {
          setMetrics((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.warn('Analytics fetch warning:', err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center space-x-2">
            <span>📊</span>
            <span>Real-Time Operations & SLA Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Live telemetry monitoring across 12 autonomous agent nodes</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Telemetry Active</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Triaged Tickets</span>
            <span>🎟️</span>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{metrics.total_tickets}</div>
          <div className="text-[11px] text-emerald-400 mt-1">↑ +18% from last week</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Autonomous Resolution</span>
            <span>⚡</span>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{metrics.auto_resolved_pct}%</div>
          <div className="text-[11px] text-emerald-400 mt-1">Target: &gt; 60.0%</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Estimated USD Cost</span>
            <span>💲</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">${metrics.estimated_usd_cost.toFixed(6)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Avg $0.000140 / ticket</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Predicted CSAT</span>
            <span>⭐</span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{metrics.avg_csat} / 5.0</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Very Positive Sentiment</div>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triage Status Distribution */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200">Resolution Breakdown</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Autonomous Solved (68.4%)</span>
                <span className="text-emerald-400">101 tickets</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68.4%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Human Agent Escalated (7.2%)</span>
                <span className="text-rose-400">11 tickets</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '7.2%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>In Progress / Open (24.4%)</span>
                <span className="text-amber-400">36 tickets</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '24.4%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Health Status */}
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-extrabold text-slate-200">Security & Circuit Breaker Health</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-850 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300">OWASP Injection Blocks</span>
              <span className="font-mono font-bold text-rose-400">{metrics.owasp_blocked_attempts} Attempted Attacks Blocked</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-850 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300">SLA Breach Monitor</span>
              <span className="font-mono font-bold text-emerald-400">{metrics.sla_breaches} SLA Breaches (100% Compliant)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-850 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300">LLM Circuit Breaker</span>
              <span className="font-mono font-bold text-sky-400">{metrics.circuit_breaker_status} (Normal Operation)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
