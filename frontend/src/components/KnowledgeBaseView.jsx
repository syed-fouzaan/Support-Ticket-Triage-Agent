import React, { useState } from 'react';
import { Database, Search, FileText, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

export default function KnowledgeBaseView() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const docs = [
    { id: "doc_faq_01", title: "Payment API Retry Rules & Idempotency", category: "faq", chunks: 4, updated: "Today", excerpt: "Requests to POST /api/v2/checkout require an Idempotency-Key header. Automatic retries trigger on HTTP 500, 502, 503 errors..." },
    { id: "doc_pol_02", title: "Handling Duplicate Card Charges & Refunds", category: "policy", chunks: 2, updated: "Yesterday", excerpt: "If a customer reports a duplicate authorization charge, verify transaction hashes in Stripe dashboard before issuing instant credit..." },
    { id: "doc_man_03", title: "Team Seat Upgrades & Prorated Billing", category: "manual", chunks: 5, updated: "3 days ago", excerpt: "Adding seats to an existing subscription calculates prorated charges for remaining days in current billing cycle..." },
    { id: "doc_gui_04", title: "Dark Mode Export Roadmap (FEAT-1049)", category: "guide", chunks: 3, updated: "1 week ago", excerpt: "Dark mode PDF generation is planned for Q3 release using Puppeteer headless renderer..." }
  ];

  const filtered = docs.filter(d => {
    const matchesQ = d.title.toLowerCase().includes(query.toLowerCase()) || d.excerpt.toLowerCase().includes(query.toLowerCase());
    const matchesC = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesQ && matchesC;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">ChromaDB Grounding Vector Store</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Partitioned knowledge collections embedded via bge-small-en-v1.5 (~512 token chunks, 15% overlap).
          </p>
        </div>

        <button 
          onClick={() => alert("Document Ingestion Triggered: Ingesting sample_tickets/knowledge/ into ChromaDB...")}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest New Document</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Vector search knowledge base..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'faq', 'policy', 'manual', 'guide'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc) => (
          <div key={doc.id} className="glass-card p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {doc.category}
                </span>
                <span className="text-[11px] font-mono text-slate-500">{doc.chunks} vector chunks</span>
              </div>

              <h3 className="text-sm font-bold text-white mb-2">{doc.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">{doc.excerpt}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
              <span>ID: {doc.id}</span>
              <span className="text-indigo-400 flex items-center cursor-pointer hover:underline">
                View Chunks <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
