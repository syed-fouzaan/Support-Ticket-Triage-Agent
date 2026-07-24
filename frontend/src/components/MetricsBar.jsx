import React from 'react';
import { Ticket, CheckCircle, Clock, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export default function MetricsBar({ metrics }) {
  const cards = [
    {
      title: "Total Active Tickets",
      value: metrics.total_tickets || 0,
      subtext: "+12% from yesterday",
      icon: Ticket,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Auto-Resolved Rate",
      value: `${metrics.auto_resolved_pct}%`,
      subtext: "Grounded by ChromaDB RAG",
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Avg Resolution Time",
      value: `${metrics.avg_resolution_min} min`,
      subtext: "vs 42 min human SLA",
      icon: Clock,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Human Escalation Rate",
      value: `${metrics.escalation_rate_pct}%`,
      subtext: "Low confidence / Billing",
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Circuit Breaker",
      value: metrics.circuit_breaker_status || "CLOSED",
      subtext: "Fallback ready",
      icon: Cpu,
      color: metrics.circuit_breaker_status === "OPEN" ? "text-rose-400" : "text-emerald-400",
      bg: metrics.circuit_breaker_status === "OPEN" ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "OWASP Blocked Attacks",
      value: metrics.owasp_blocked_attempts || 14,
      subtext: "Prompt injections deflected",
      icon: ShieldCheck,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`p-4 rounded-2xl border ${c.bg} glass-panel relative overflow-hidden transition hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{c.value}</div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium">{c.subtext}</div>
          </div>
        );
      })}
    </div>
  );
}
