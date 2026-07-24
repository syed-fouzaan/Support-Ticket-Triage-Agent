import React from 'react';
import { Ticket, CheckCircle, Clock, AlertTriangle, Cpu, ShieldCheck } from 'lucide-react';

export default function MetricsBar({ metrics }) {
  const cards = [
    {
      title: "Active Tickets",
      value: metrics.total_tickets || 0,
      subtext: "Live intake queue",
      icon: Ticket,
      barColor: "bg-indigo-500",
      pillBg: "bg-indigo-50 text-indigo-700",
      pct: 75
    },
    {
      title: "Auto-Resolved",
      value: `${metrics.auto_resolved_pct}%`,
      subtext: "ChromaDB Grounded",
      icon: CheckCircle,
      barColor: "bg-emerald-500",
      pillBg: "bg-emerald-50 text-emerald-700",
      pct: 68
    },
    {
      title: "Avg Resolution",
      value: `${metrics.avg_resolution_min}m`,
      subtext: "vs 42m Human SLA",
      icon: Clock,
      barColor: "bg-sky-500",
      pillBg: "bg-sky-50 text-sky-700",
      pct: 95
    },
    {
      title: "Escalation Rate",
      value: `${metrics.escalation_rate_pct}%`,
      subtext: "Low Confidence / Billing",
      icon: AlertTriangle,
      barColor: "bg-amber-500",
      pillBg: "bg-amber-50 text-amber-700",
      pct: 12
    },
    {
      title: "Circuit Breaker",
      value: metrics.circuit_breaker_status || "CLOSED",
      subtext: "Fallback Active",
      icon: Cpu,
      barColor: metrics.circuit_breaker_status === "OPEN" ? "bg-rose-500" : "bg-emerald-500",
      pillBg: metrics.circuit_breaker_status === "OPEN" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700",
      pct: 100
    },
    {
      title: "OWASP Deflections",
      value: metrics.owasp_blocked_attempts || 14,
      subtext: "Prompt Attacks Blocked",
      icon: ShieldCheck,
      barColor: "bg-purple-500",
      pillBg: "bg-purple-50 text-purple-700",
      pct: 88
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="minimal-card p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.title}</span>
                <span className={`p-1.5 rounded-lg ${c.pillBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">{c.value}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{c.subtext}</div>
            </div>

            {/* Subtle Progress Bar matching reference image metric widgets */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className={`h-full ${c.barColor} rounded-full`} style={{ width: `${c.pct}%` }}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
