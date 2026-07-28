import React from 'react';
import { Plus, RefreshCw, Phone } from 'lucide-react';

const TABS = [
  { id: 'triage',    label: 'Triage Operations' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'security',  label: 'Security & Audit' },
  { id: 'analytics', label: 'Analytics & SLA' },
  { id: 'kanban',    label: 'Kanban Board' },
];

export default function Header({ activeTab, setActiveTab, onNewTicket, onOpenVoiceCall, apiOnline, onRefresh }) {
  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      marginBottom: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54 }}>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', gap: 2 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? '#1a202c' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* API status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 8, padding: '5px 12px', fontSize: 12,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: apiOnline ? '#48bb78' : '#f6ad55',
              display: 'inline-block',
              boxShadow: apiOnline ? '0 0 0 2px rgba(72,187,120,0.3)' : '0 0 0 2px rgba(246,173,85,0.3)',
            }} />
            <span style={{ fontWeight: 600, color: '#374151' }}>
              {apiOnline ? 'FastAPI Active' : 'Standalone Demo'}
            </span>
            <span style={{ color: '#cbd5e0', margin: '0 2px' }}>|</span>
            <span style={{ fontWeight: 700, color: '#1a202c', fontSize: 11 }}>🏢 Org: Rooman Tech</span>
          </div>

          {/* Voice Simulator */}
          <button
            onClick={onOpenVoiceCall}
            title="Open WebRTC Voice Simulator"
            style={{
              background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
              transition: 'background 0.15s',
            }}
          >
            <Phone size={13} />
            Voice Bot
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            title="Refresh Data"
            style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
              color: '#64748b', display: 'flex', alignItems: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
          >
            <RefreshCw size={14} />
          </button>

          {/* New Ticket */}
          <button
            onClick={onNewTicket}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#1a202c', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '6px 14px', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2d3748'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1a202c'; }}
          >
            <Plus size={13} />
            New Ticket
          </button>
        </div>
      </div>
    </header>
  );
}
