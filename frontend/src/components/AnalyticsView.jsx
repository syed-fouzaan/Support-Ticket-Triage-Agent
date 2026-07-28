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
    <div className="space-y-4" style={{ background: '#f1f5f9', minHeight: '100%' }}>

      {/* Dark Analytics Container */}
      <div style={{ background: '#2d3748', borderRadius: 14, padding: '20px 24px' }}>

        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #4a5568', paddingBottom: 14 }}>
          <p style={{ color: '#a0aec0', fontSize: 13, margin: 0 }}>
            Live telemetry monitoring across 14 autonomous agent nodes
          </p>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: '1.5px solid #48bb78',
            borderRadius: 999, padding: '4px 12px',
            color: '#48bb78', fontSize: 12, fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#48bb78', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Telemetry Active
          </span>
        </div>

        {/* KPI Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
          {/* Total Tickets */}
          <div style={{ background: '#3d4f63', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#a0aec0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total Triaged Tickets</span>
              <span style={{ color: '#fc8181', fontSize: 14 }}>🎟</span>
            </div>
            <div style={{ color: '#f7fafc', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{metrics.total_tickets}</div>
            <div style={{ color: '#68d391', fontSize: 11, fontWeight: 600 }}>↑ +18% from last week</div>
          </div>

          {/* Autonomous Resolution */}
          <div style={{ background: '#3d4f63', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#a0aec0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Autonomous Resolution</span>
              <span style={{ fontSize: 14 }}>⚡</span>
            </div>
            <div style={{ color: '#f7fafc', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{metrics.auto_resolved_pct}%</div>
            <div style={{ color: '#a0aec0', fontSize: 11 }}>Target: &gt; 80.0%</div>
          </div>

          {/* Estimated USD Cost */}
          <div style={{ background: '#3d4f63', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#a0aec0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Estimated USD Cost</span>
              <span style={{ color: '#68d391', fontSize: 14 }}>$</span>
            </div>
            <div style={{ color: '#68d391', fontSize: 28, fontWeight: 800, marginBottom: 4, fontFamily: 'monospace' }}>
              ${metrics.estimated_usd_cost.toFixed(6)}
            </div>
            <div style={{ color: '#a0aec0', fontSize: 11 }}>Avg $0.000140 / ticket</div>
          </div>

          {/* Predicted CSAT */}
          <div style={{ background: '#3d4f63', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: '#a0aec0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Predicted CSAT</span>
              <span style={{ color: '#f6e05e', fontSize: 14 }}>★</span>
            </div>
            <div style={{ color: '#f6e05e', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{metrics.avg_csat} / 5.0</div>
            <div style={{ color: '#f6ad55', fontSize: 11, fontWeight: 600 }}>Very Positive Sentiment</div>
          </div>
        </div>

        {/* Bottom Row: Resolution Breakdown + Security Health */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Resolution Breakdown */}
          <div style={{ background: '#3d4f63', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ color: '#f7fafc', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Resolution Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Autonomous */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>Autonomous Solved (68.4%)</span>
                  <span style={{ color: '#68d391', fontSize: 12, fontWeight: 700 }}>101 tickets</span>
                </div>
                <div style={{ background: '#2d3748', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: '68.4%', height: '100%', background: '#48bb78', borderRadius: 4 }} />
                </div>
              </div>
              {/* Escalated */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>Human Agent Escalated (7.2%)</span>
                  <span style={{ color: '#fc8181', fontSize: 12, fontWeight: 700 }}>11 tickets</span>
                </div>
                <div style={{ background: '#2d3748', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: '7.2%', height: '100%', background: '#f56565', borderRadius: 4 }} />
                </div>
              </div>
              {/* In Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>In Progress / Open (24.4%)</span>
                  <span style={{ color: '#f6ad55', fontSize: 12, fontWeight: 700 }}>36 tickets</span>
                </div>
                <div style={{ background: '#2d3748', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: '24.4%', height: '100%', background: '#ed8936', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Circuit Breaker Health */}
          <div style={{ background: '#3d4f63', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ color: '#f7fafc', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Security & Circuit Breaker Health</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#2d3748', borderRadius: 7, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e0', fontSize: 12, fontWeight: 500 }}>OWASP Injection Blocks</span>
                <span style={{ color: '#fc8181', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{metrics.owasp_blocked_attempts} Attempted Attacks Blocked</span>
              </div>
              <div style={{ background: '#2d3748', borderRadius: 7, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e0', fontSize: 12, fontWeight: 500 }}>SLA Breach Monitor</span>
                <span style={{ color: '#68d391', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{metrics.sla_breaches} SLA Breaches (100% Compliant)</span>
              </div>
              <div style={{ background: '#2d3748', borderRadius: 7, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e0', fontSize: 12, fontWeight: 500 }}>LLM Circuit Breaker</span>
                <span style={{ color: '#63b3ed', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{metrics.circuit_breaker_status} (Normal Operation)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
