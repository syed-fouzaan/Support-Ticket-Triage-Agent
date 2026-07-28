import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import TicketQueue from './components/TicketQueue';
import TicketInspector from './components/TicketInspector';
import CustomerPortalModal from './components/CustomerPortalModal';
import SecurityAuditView from './components/SecurityAuditView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import AnalyticsView from './components/AnalyticsView';
import KanbanView from './components/KanbanView';

import { Agentation } from 'agentation';

import { MOCK_TICKETS, MOCK_METRICS } from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('triage');
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  // Poll backend health, tickets, and analytics metrics
  const fetchData = async () => {
    try {
      const resHealth = await fetch('/api/v1/health/live', { signal: AbortSignal.timeout(2500) });
      if (resHealth.ok) {
        setApiOnline(true);
        
        // 1. Fetch live tickets list from FastAPI
        const resTickets = await fetch('/api/v1/tickets');
        if (resTickets.ok) {
          const apiTickets = await resTickets.json();
          if (Array.isArray(apiTickets) && apiTickets.length > 0) {
            setTickets(prev => {
              // Merge mock tickets with api tickets so view is always rich
              const existingIds = new Set(apiTickets.map(t => t.id));
              const remainingMocks = prev.filter(t => !existingIds.has(t.id));
              return [...apiTickets, ...remainingMocks];
            });
          }
        }

        // 2. Fetch live metrics from FastAPI
        const resMetrics = await fetch('/api/v1/analytics/summary');
        if (resMetrics.ok) {
          const apiMetrics = await resMetrics.json();
          setMetrics(prev => ({
            ...prev,
            ...apiMetrics
          }));
        }

      } else {
        setApiOnline(false);
      }
    } catch (err) {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Handle Approve Resolution (POST /api/v1/tickets/{id}/approve)
  const handleApproveResolution = async (ticketId, finalResolution) => {
    if (apiOnline) {
      try {
        await fetch(`/api/v1/tickets/${ticketId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution_text: finalResolution })
        });
      } catch (e) {
        console.error("Approve API error:", e);
      }
    }

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'SOLVED',
          resolution_draft: finalResolution,
          audit_trail: [
            ...(t.audit_trail || []),
            { step: 'Human Ops Review', timestamp: new Date().toLocaleTimeString(), detail: 'Approved and dispatched resolution to customer', status: 'success' }
          ]
        };
      }
      return t;
    }));
    setSelectedTicket(null);
  };

  // Handle Escalate Ticket (POST /api/v1/tickets/{id}/escalate)
  const handleEscalateTicket = async (ticketId) => {
    if (apiOnline) {
      try {
        await fetch(`/api/v1/tickets/${ticketId}/escalate`, { method: 'POST' });
      } catch (e) {
        console.error("Escalate API error:", e);
      }
    }

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'ESCALATED',
          urgency: 'HOT',
          audit_trail: [
            ...(t.audit_trail || []),
            { step: 'Human Ops Override', timestamp: new Date().toLocaleTimeString(), detail: 'Force-escalated to Engineering Tier 3', status: 'danger' }
          ]
        };
      }
      return t;
    }));
    setSelectedTicket(null);
  };

  // Handle Create Ticket (POST /api/v1/tickets -> Runs 7-Agent LangGraph Workflow)
  const handleCreateTicket = async (newTicketData) => {
    if (apiOnline) {
      try {
        const res = await fetch('/api/v1/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTicketData)
        });
        if (res.ok) {
          const processedTicket = await res.json();
          setTickets(prev => [processedTicket, ...prev]);
          setMetrics(prev => ({
            ...prev,
            total_tickets: prev.total_tickets + 1
          }));
          return;
        }
      } catch (e) {
        console.error("Create ticket API error:", e);
      }
    }

    // Fallback if API offline
    const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const fallbackTicket = {
      id: newId,
      customer_id: `cus_${newTicketData.customer_tier}_${Math.floor(Math.random() * 100)}`,
      customer_name: newTicketData.customer_name,
      customer_email: newTicketData.customer_email,
      customer_tier: newTicketData.customer_tier,
      subject: newTicketData.subject,
      body: newTicketData.body,
      channel: newTicketData.channel,
      status: 'OPEN',
      urgency: newTicketData.subject.toLowerCase().includes('urgent') || newTicketData.subject.toLowerCase().includes('error') ? 'HOT' : 'WARM',
      urgency_score: 0.85,
      intent: 'GeneralQuery',
      confidence: 0.88,
      pii_found: newTicketData.body.includes('@') || /\d{4}/.test(newTicketData.body),
      pii_redacted_body: newTicketData.body.replace(/\d{4}-\d{4}-\d{4}-\d{4}/g, '[REDACTED_CARD]').replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]'),
      language: 'en',
      created_at: new Date().toISOString(),
      resolution_draft: `Thank you for contacting SentinelDesk Support. We have received your query regarding "${newTicketData.subject}" and our grounded AI agent is reviewing solution documents.`,
      rag_sources: [
        { id: "kb-autogen", title: "General Support & Escalation Procedures", score: 0.84, type: "policy" }
      ],
      audit_trail: [
        { step: 'Intake Node', timestamp: new Date().toLocaleTimeString(), detail: 'Ticket created via ' + newTicketData.channel, status: 'success' },
        { step: 'PII Scanner', timestamp: new Date().toLocaleTimeString(), detail: 'Redaction check completed', status: 'success' },
        { step: 'Intent Node', timestamp: new Date().toLocaleTimeString(), detail: 'Tagged GeneralQuery (confidence 0.88)', status: 'success' }
      ]
    };

    setTickets(prev => [fallbackTicket, ...prev]);
    setMetrics(prev => ({
      ...prev,
      total_tickets: prev.total_tickets + 1
    }));
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex font-sans antialiased">
      
      {/* Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onNewTicket={() => setShowNewTicketModal(true)}
      />

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: '#f1f5f9' }}>

        {/* Sticky Top Bar: Header tabs + Metrics strip */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNewTicket={() => setShowNewTicketModal(true)}
            apiOnline={apiOnline}
            metrics={metrics}
            onRefresh={fetchData}
          />
          <MetricsBar metrics={metrics} />
        </div>

        {/* Scrollable Content */}
        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

          {activeTab === 'triage' && (
            <TicketQueue
              tickets={tickets}
              onSelectTicket={(t) => setSelectedTicket(t)}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBaseView apiOnline={apiOnline} />
          )}

          {activeTab === 'security' && (
            <SecurityAuditView />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView />
          )}

          {activeTab === 'kanban' && (
            <KanbanView tickets={tickets} onTicketMove={(t) => console.log('Moved:', t)} />
          )}

        </main>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #e2e8f0', background: '#fff', padding: '10px 0', textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          SentinelDesk 🛡️ Enterprise Autonomous AI Platform · Built for Rooman Technologies
        </footer>
      </div>

      {/* Modals */}
      {selectedTicket && (
        <TicketInspector 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)}
          onApprove={handleApproveResolution}
          onEscalate={handleEscalateTicket}
        />
      )}

      {showNewTicketModal && (
        <CustomerPortalModal 
          onClose={() => setShowNewTicketModal(false)}
          onSubmitTicket={handleCreateTicket}
        />
      )}

      {/* Agentation Overlay */}
      {typeof Agentation !== 'undefined' && <Agentation />}

    </div>
  );
}
