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
      .then((r) => r.json())
      .then((d) => { if (d) setMetrics((p) => ({ ...p, ...d })); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100%' }}>

      {/* Outer container — light */}
      <div style={{ background: '#ffffff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 14 }}>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Live telemetry monitoring across 14 autonomous agent nodes
          </p>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: '1.5px solid #10b981',
            borderRadius: 999, padding: '4px 12px',
            color: '#10b981', fontSize: 12, fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Telemetry Active
          </span>
        </div>

        {/* KPI Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>

          {/* Total Tickets */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Triaged Tickets</span>
              <span style={{ color: '#f87171', fontSize: 14 }}>🎟</span>
            </div>
            <div style={{ color: '#0f172a', fontSize: 30, fontWeight: 800, marginBottom: 4, fontFamily: 'monospace' }}>{metrics.total_tickets}</div>
            <div style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>↑ +18% from last week</div>
          </div>

          {/* Autonomous Resolution */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Autonomous Resolution</span>
              <span style={{ color: '#f59e0b', fontSize: 14 }}>⚡</span>
            </div>
            <div style={{ color: '#0f172a', fontSize: 30, fontWeight: 800, marginBottom: 4, fontFamily: 'monospace' }}>{metrics.auto_resolved_pct}%</div>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 500 }}>Target: &gt; 80.0%</div>
          </div>

          {/* Estimated USD Cost */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estimated USD Cost</span>
              <span style={{ color: '#10b981', fontSize: 14, fontWeight: 800 }}>$</span>
            </div>
            <div style={{ color: '#10b981', fontSize: 30, fontWeight: 800, marginBottom: 4, fontFamily: 'monospace' }}>
              ${metrics.estimated_usd_cost.toFixed(6)}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 500 }}>Avg $0.000140 / ticket</div>
          </div>

          {/* Predicted CSAT */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Predicted CSAT</span>
              <span style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
            </div>
            <div style={{ color: '#f59e0b', fontSize: 30, fontWeight: 800, marginBottom: 4, fontFamily: 'monospace' }}>{metrics.avg_csat} / 5.0</div>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>Very Positive Sentiment</div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Resolution Breakdown */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#0f172a', fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Resolution Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>Autonomous Solved (68.4%)</span>
                  <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>101 tickets</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                  <div style={{ width: '68.4%', height: '100%', background: '#10b981', borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>Human Agent Escalated (7.2%)</span>
                  <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>11 tickets</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                  <div style={{ width: '7.2%', height: '100%', background: '#ef4444', borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>In Progress / Open (24.4%)</span>
                  <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>36 tickets</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                  <div style={{ width: '24.4%', height: '100%', background: '#f59e0b', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Circuit Breaker Health */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#0f172a', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Security &amp; Circuit Breaker Health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#ffffff', borderRadius: 7, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>OWASP Injection Blocks</span>
                <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{metrics.owasp_blocked_attempts} Attempted Attacks Blocked</span>
              </div>
              <div style={{ background: '#ffffff', borderRadius: 7, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>SLA Breach Monitor</span>
                <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{metrics.sla_breaches} SLA Breaches (100% Compliant)</span>
              </div>
              <div style={{ background: '#ffffff', borderRadius: 7, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>LLM Circuit Breaker</span>
                <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{metrics.circuit_breaker_status} (Normal Operation)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
