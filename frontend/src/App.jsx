import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricsBar from './components/MetricsBar';
import TicketQueue from './components/TicketQueue';
import TicketInspector from './components/TicketInspector';
import CustomerPortalModal from './components/CustomerPortalModal';
import SecurityAuditView from './components/SecurityAuditView';
import KnowledgeBaseView from './components/KnowledgeBaseView';

import { MOCK_TICKETS, MOCK_METRICS } from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('triage');
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);

  // Poll backend health & tickets
  const fetchData = async () => {
    try {
      const resHealth = await fetch('/api/v1/health/live', { signal: AbortSignal.timeout(2000) });
      if (resHealth.ok) {
        setApiOnline(true);
        // Try fetching tickets from backend API
        const resTickets = await fetch('/api/v1/tickets');
        if (resTickets.ok) {
          const apiTickets = await resTickets.json();
          if (Array.isArray(apiTickets) && apiTickets.length > 0) {
            setTickets(apiTickets);
          }
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle Ticket Actions
  const handleApproveResolution = (ticketId, finalResolution) => {
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

  const handleEscalateTicket = (ticketId) => {
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

  const handleCreateTicket = async (newTicketData) => {
    const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdTicket = {
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

    setTickets(prev => [createdTicket, ...prev]);
    setMetrics(prev => ({
      ...prev,
      total_tickets: prev.total_tickets + 1
    }));
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 flex flex-col font-sans antialiased relative">
      
      {/* Ambient Radial Mesh Background */}
      <div className="ambient-bg"></div>

      {/* Header Bar */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onNewTicket={() => setShowNewTicketModal(true)}
        apiOnline={apiOnline}
        metrics={metrics}
        onRefresh={fetchData}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Stat Cards */}
        <MetricsBar metrics={metrics} />

        {/* Tab View Switching */}
        {activeTab === 'triage' && (
          <TicketQueue 
            tickets={tickets} 
            onSelectTicket={(t) => setSelectedTicket(t)} 
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBaseView />
        )}

        {activeTab === 'security' && (
          <SecurityAuditView />
        )}

      </main>

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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-4 text-center text-xs text-slate-500 font-mono">
        SentinelDesk 🛡️ Multi-Agent AI Customer Support Triage Platform · Built for Rooman Technologies
      </footer>

    </div>
  );
}
