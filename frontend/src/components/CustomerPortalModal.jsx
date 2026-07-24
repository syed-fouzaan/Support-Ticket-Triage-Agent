import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle } from 'lucide-react';

export default function CustomerPortalModal({ onClose, onSubmitTicket }) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tier, setTier] = useState('pro');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState('web');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !body || !customerEmail) return;

    setSubmitting(true);
    await onSubmitTicket({
      customer_name: customerName || 'Valued Customer',
      customer_email: customerEmail,
      customer_tier: tier,
      subject,
      body,
      channel
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F172A] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Submit Customer Support Ticket</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer Email</label>
              <input
                type="email"
                required
                placeholder="jane@company.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subscription Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="free">Free Tier</option>
                <option value="pro">Pro Tier</option>
                <option value="enterprise">Enterprise Tier</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="web">Web Portal</option>
                <option value="email">Email Connector</option>
                <option value="api">REST API</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ticket Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Cannot access team billing settings"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ticket Description / Body</label>
            <textarea
              required
              rows={4}
              placeholder="Describe your issue in detail (PII like credit cards or emails will be automatically sanitized)..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Submitting will trigger instant AI intake, intent scoring, PII redaction, and ChromaDB grounded resolution drafting.</span>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Triage Running...' : 'Submit Ticket'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
