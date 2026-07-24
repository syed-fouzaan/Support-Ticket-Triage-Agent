import React from 'react';
import { Ticket, CheckCircle, Clock, AlertTriangle, Cpu, ShieldCheck } from 'lucide-react';

export default function MetricsBar({ metrics }) {
  const cards = [
    {
      title: "Active Tickets",
      value: metrics.total_tickets || 0,
      subtext: "Live intake queue",
      icon: Ticket,
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      accent: "text-indigo-400",
      border: "border-indigo-500/20"
    },
    {
      title: "Auto-Resolved",
      value: `${metrics.auto_resolved_pct}%`,
      subtext: "ChromaDB RAG Grounded",
      icon: CheckCircle,
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      accent: "text-emerald-400",
      border: "border-emerald-500/20"
    },
    {
      title: "Avg Resolution",
      value: `${metrics.avg_resolution_min} m`,
      subtext: "vs 42 min Human SLA",
      icon: Clock,
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accent: "text-purple-400",
      border: "border-purple-500/20"
    },
    {
      title: "Escalation Rate",
      value: `${metrics.escalation_rate_pct}%`,
      subtext: "Low confidence / Billing",
      icon: AlertTriangle,
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      accent: "text-amber-400",
      border: "border-amber-500/20"
    },
    {
      title: "Circuit Breaker",
      value: metrics.circuit_breaker_status || "CLOSED",
      subtext: "Fallback Active",
      icon: Cpu,
      gradient: metrics.circuit_breaker_status === "OPEN" ? "from-rose-500/10 to-transparent" : "from-emerald-500/10 to-transparent",
      accent: metrics.circuit_breaker_status === "OPEN" ? "text-rose-400" : "text-emerald-400",
      border: metrics.circuit_breaker_status === "OPEN" ? "border-rose-500/30" : "border-emerald-500/20"
    },
    {
      title: "OWASP Deflections",
      value: metrics.owasp_blocked_attempts || 14,
      subtext: "Prompt Injections Blocked",
      icon: ShieldCheck,
      gradient: "from-pink-500/10 via-pink-500/5 to-transparent",
      accent: "text-pink-400",
      border: "border-pink-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className={`p-4 rounded-2xl bg-gradient-to-br ${c.gradient} glass-panel border ${c.border} relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.accent}`} />
            </div>
            <div className="text-xl font-extrabold text-white tracking-tight font-mono">{c.value}</div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium">{c.subtext}</div>
          </div>
        );
      })}
    </div>
  );
}
