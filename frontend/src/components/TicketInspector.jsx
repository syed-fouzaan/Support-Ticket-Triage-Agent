import React, { useState } from 'react';
import { X, ShieldCheck, Eye, EyeOff, Send, AlertTriangle, CheckCircle, Database, Lock, Clock, Sparkles } from 'lucide-react';

export default function TicketInspector({ ticket, onClose, onApprove, onEscalate }) {
  const [showRawPII, setShowRawPII] = useState(false);
  const [resolutionText, setResolutionText] = useState(ticket?.resolution_draft || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0F172A] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold text-indigo-400">{ticket.id}</span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-semibold text-slate-300">{ticket.customer_name}</span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {ticket.customer_tier}
            </span>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Banner & Subject */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white">{ticket.subject}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-mono">Confidence: {(ticket.confidence * 100).toFixed(0)}%</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                  ticket.urgency === 'HOT' ? 'bg-rose-500/20 text-rose-400' : 
                  ticket.urgency === 'WARM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {ticket.urgency}
                </span>
              </div>
            </div>

            {/* PII Toggle & Body */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-slate-400 font-medium flex items-center">
                  Ticket Content
                  {ticket.pii_found && (
                    <span className="ml-2 text-rose-400 font-mono text-[10px] flex items-center bg-rose-500/10 px-1.5 py-0.5 rounded">
                      <Lock className="w-3 h-3 mr-1" /> PII Masked
                    </span>
                  )}
                </span>

                {ticket.pii_found && (
                  <button 
                    onClick={() => setShowRawPII(!showRawPII)}
                    className="flex items-center space-x-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    {showRawPII ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showRawPII ? 'Hide Raw PII' : 'Show Unredacted PII'}</span>
                  </button>
                )}
              </div>

              <div className="p-3 bg-[#0B0F19] rounded-lg text-xs font-mono text-slate-300 leading-relaxed border border-slate-800">
                {showRawPII ? ticket.body : (ticket.pii_redacted_body || ticket.body)}
              </div>
            </div>
          </div>

          {/* RAG Knowledge Base Sources */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Database className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">ChromaDB RAG Grounding Context</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ticket.rag_sources && ticket.rag_sources.length > 0 ? (
                ticket.rag_sources.map((src, i) => (
                  <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{src.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono">Source Type: {src.type}</div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 rounded">
                      {(src.score * 100).toFixed(0)}% Match
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-500 text-xs italic text-center">
                  No RAG sources matched or ticket escalated before vector retrieval
                </div>
              )}
            </div>
          </div>

          {/* AI Resolution Draft Section */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Grounded AI Resolution Draft</h3>
              </div>

              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {isEditing ? 'Save Edit' : 'Edit Resolution'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-[#0B0F19] border border-indigo-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400"
              />
            ) : (
              <div className="p-3 bg-[#0B0F19]/80 rounded-lg text-xs text-slate-200 leading-relaxed border border-slate-800/60">
                {resolutionText || "No resolution draft available."}
              </div>
            )}
          </div>

          {/* Append-Only Audit Trail */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Append-Only Audit Log Timeline</h3>
            </div>

            <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              {ticket.audit_trail && ticket.audit_trail.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0 font-mono">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500">{item.timestamp}</span>
                    <span className="text-slate-300 font-semibold">{item.step}:</span>
                    <span className="text-slate-400">{item.detail}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${
                    item.status === 'danger' ? 'bg-rose-500/20 text-rose-400' :
                    item.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0B0F19] flex items-center justify-between">
          <button
            onClick={() => onEscalate(ticket.id)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Force Escalate to Human Tier 3</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              onClick={() => onApprove(ticket.id, resolutionText)}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95"
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
