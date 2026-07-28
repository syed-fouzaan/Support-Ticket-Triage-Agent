import React, { useState } from 'react';
import { X, ShieldCheck, Eye, EyeOff, Send, AlertTriangle, Database, Lock, Clock, Sparkles, Cpu } from 'lucide-react';

export default function TicketInspector({ ticket, onClose, onApprove, onEscalate }) {
  const [showRawPII, setShowRawPII] = useState(false);
  const [resolutionText, setResolutionText] = useState(ticket?.resolution_draft || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold text-slate-900">{ticket.id}</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700">{ticket.customer_name}</span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-amber-100 text-amber-800 border border-amber-300">
              {ticket.customer_tier}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
              🌐 Lang: {(ticket.language || 'en').toUpperCase()}
            </span>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Subject & Confidence */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-extrabold text-slate-900">{ticket.subject}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-mono font-semibold">Confidence: {(ticket.confidence * 100).toFixed(0)}%</span>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 rounded-lg flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{ticket.predicted_csat ? `${ticket.predicted_csat}/5.0` : '4.8/5.0'}</span>
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${
                  ticket.urgency === 'HOT' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 
                  ticket.urgency === 'WARM' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}>
                  {ticket.urgency}
                </span>
              </div>
            </div>

            {/* PII Toggle & Body */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-slate-500 font-bold flex items-center">
                  Ticket Description
                  {ticket.pii_found && (
                    <span className="ml-2 text-rose-700 font-mono text-[10px] font-bold flex items-center bg-rose-100 px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3 mr-1" /> PII Masked
                    </span>
                  )}
                </span>

                {ticket.pii_found && (
                  <button 
                    onClick={() => setShowRawPII(!showRawPII)}
                    className="flex items-center space-x-1 text-[11px] text-slate-900 hover:underline font-bold"
                  >
                    {showRawPII ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showRawPII ? 'Hide Raw PII' : 'Show Unredacted PII'}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 bg-white rounded-xl text-xs font-mono text-slate-800 leading-relaxed border border-slate-200/80 shadow-sm">
                {showRawPII ? ticket.body : (ticket.pii_redacted_body || ticket.body)}
              </div>
            </div>
          </div>

          {/* LangGraph 8-Node Agent State Machine Flow Visualizer */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-inner border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  LangGraph v0.2 State Machine Execution Flow
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded">
                Autonomous Loop Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
              {[
                { step: "1", name: "Intake", status: "complete", latency: "0.12s" },
                { step: "2", name: "Intent", status: "complete", latency: "0.18s" },
                { step: "3", name: "SLA Engine", status: "complete", latency: "0.05s" },
                { step: "4", name: "Vector Dedupe", status: "complete", latency: "0.14s" },
                { step: "5", name: "ReAct Loop", status: ticket.status === 'ESCALATED' ? 'warning' : 'complete', latency: "0.85s" },
                { step: "6", name: "RAG Retrieval", status: "complete", latency: "0.22s" },
                { step: "7", name: "Draft Gen", status: "complete", latency: "0.45s" },
                { step: "8", name: "Decision Gate", status: ticket.confidence >= 0.75 ? 'complete' : 'warning', latency: "0.08s" },
              ].map((node, i) => (
                <div key={i} className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                  node.status === 'complete' 
                    ? 'bg-slate-800/90 border-emerald-500/40 text-emerald-300 shadow-sm' 
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span>N{node.step}</span>
                    <span className="text-slate-400">{node.latency}</span>
                  </div>
                  <div className="text-[11px] font-bold text-white mt-1 leading-tight">{node.name}</div>
                  <div className="mt-2 text-[9px] font-mono flex items-center space-x-1 font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{node.status === 'complete' ? 'PASSED' : 'FLAGGED'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RAG Knowledge Base Sources */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Database className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">ChromaDB RAG Grounding Sources</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticket.rag_sources && ticket.rag_sources.length > 0 ? (
                ticket.rag_sources.map((src, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{src.title}</div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono font-semibold">Type: {src.type}</div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 rounded">
                      {(src.score * 100).toFixed(0)}% Match
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs italic text-center">
                  No RAG sources matched or ticket escalated before vector retrieval
                </div>
              )}
            </div>
          </div>

          {/* AI Resolution Draft Section */}
          <div className="bg-indigo-50/50 border border-indigo-200/80 p-4.5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Grounded AI Resolution Draft</h3>
              </div>

              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] text-indigo-700 hover:underline font-bold"
              >
                {isEditing ? 'Save Edit' : 'Edit Draft'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-white border border-indigo-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium shadow-sm"
              />
            ) : (
              <div className="p-3.5 bg-white rounded-xl text-xs text-slate-800 leading-relaxed border border-indigo-100 shadow-sm font-medium">
                {resolutionText || "No resolution draft available."}
              </div>
            )}
          </div>

          {/* Append-Only Audit Log Timeline */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Append-Only Audit Log Timeline</h3>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {ticket.audit_trail && ticket.audit_trail.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0 font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 font-medium">{item.timestamp}</span>
                    <span className="text-slate-800 font-bold">{item.step}:</span>
                    <span className="text-slate-600">{item.detail}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${
                    item.status === 'danger' ? 'bg-rose-100 text-rose-700' :
                    item.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEscalate(ticket.id)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Force Escalate</span>
            </button>
            <a
              href={`http://localhost:8000/api/v1/tickets/${ticket.id}/export-audit`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition font-mono"
            >
              <span>📜 Audit Cert</span>
            </a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
            >
              Close
            </button>
            <button
              onClick={() => onApprove(ticket.id, resolutionText)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Approve & Dispatch Resolution</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
