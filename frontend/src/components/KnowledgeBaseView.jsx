import React, { useState } from 'react';
import { Database, Search, Plus, ArrowRight } from 'lucide-react';

export default function KnowledgeBaseView({ apiOnline }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [ingesting, setIngesting] = useState(false);

  const [docs, setDocs] = useState([
    { id: "doc_faq_01", title: "Payment API Retry Rules & Idempotency", category: "faq", chunks: 4, updated: "Today", excerpt: "Requests to POST /api/v2/checkout require an Idempotency-Key header. Automatic retries trigger on HTTP 500, 502, 503 errors..." },
    { id: "doc_pol_02", title: "Handling Duplicate Card Charges & Refunds", category: "policy", chunks: 2, updated: "Yesterday", excerpt: "If a customer reports a duplicate authorization charge, verify transaction hashes in Stripe dashboard before issuing instant credit..." },
    { id: "doc_man_03", title: "Team Seat Upgrades & Prorated Billing", category: "manual", chunks: 5, updated: "3 days ago", excerpt: "Adding seats to an existing subscription calculates prorated charges for remaining days in current billing cycle..." },
    { id: "doc_gui_04", title: "Dark Mode Export Roadmap (FEAT-1049)", category: "guide", chunks: 3, updated: "1 week ago", excerpt: "Dark mode PDF generation is planned for Q3 release using Puppeteer headless renderer..." }
  ]);

  const handleIngest = async () => {
    setIngesting(true);
    if (apiOnline) {
      try {
        const res = await fetch('/api/v1/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: "API Timeout & Backoff Guidelines v2",
            content: "Clients encountering HTTP 504 Gateway Timeout during high volume batch processing must enable exponential backoff starting at 100ms jitter.",
            source_type: "manual"
          })
        });
        if (res.ok) {
          const data = await res.json();
          alert(`Document Ingested into ChromaDB Vector Store! Doc ID: ${data.doc_id}, Chunks: ${data.chunks}`);
          setDocs(prev => [
            {
              id: data.doc_id,
              title: "API Timeout & Backoff Guidelines v2",
              category: "manual",
              chunks: data.chunks,
              updated: "Just now",
              excerpt: "Clients encountering HTTP 504 Gateway Timeout during high volume batch processing must enable exponential backoff starting at 100ms jitter."
            },
            ...prev
          ]);
          setIngesting(false);
          return;
        }
      } catch (e) {
        console.error("Ingest API error:", e);
      }
    }

    alert("Simulating Document Ingestion: Chunked into 512-token segments and indexed into ChromaDB collection 'sentineldesk_manual'");
    setIngesting(false);
  };

  const filtered = docs.filter(d => {
    const matchesQ = d.title.toLowerCase().includes(query.toLowerCase()) || d.excerpt.toLowerCase().includes(query.toLowerCase());
    const matchesC = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesQ && matchesC;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="minimal-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-slate-900" />
            <h2 className="text-base font-extrabold text-slate-900">ChromaDB Vector Store Collections</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Partitioned knowledge collections embedded via bge-small-en-v1.5 (~512 token chunks, 15% overlap).
          </p>
        </div>

        <button 
          onClick={handleIngest}
          disabled={ingesting}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{ingesting ? 'Indexing Vector Store...' : 'Ingest New Document'}</span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Vector search knowledge base..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'faq', 'policy', 'manual', 'guide'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200/60'
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
          <div key={doc.id} className="minimal-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {doc.category}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">{doc.chunks} vector chunks</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-2">{doc.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4 font-medium">{doc.excerpt}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono font-semibold">
              <span>ID: {doc.id}</span>
              <span className="text-slate-900 font-bold flex items-center cursor-pointer hover:underline">
                View Chunks <ArrowRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
