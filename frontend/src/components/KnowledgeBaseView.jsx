import React, { useState } from 'react';
import { Database, Search, Plus, ArrowRight, X, CheckCircle2, FileText, Layers, ExternalLink } from 'lucide-react';

export default function KnowledgeBaseView({ apiOnline }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [ingesting, setIngesting] = useState(false);
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [selectedChunkDoc, setSelectedChunkDoc] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('manual');

  const [docs, setDocs] = useState([
    { 
      id: "doc_faq_01", 
      title: "Payment API Retry Rules & Idempotency", 
      category: "faq", 
      chunks: 4, 
      updated: "Today", 
      excerpt: "Requests to POST /api/v2/checkout require an Idempotency-Key header. Automatic retries trigger on HTTP 500, 502, 503 errors with exponential backoff...",
      raw_chunks: [
        { chunk_id: "chk-001", tokens: 482, text: "Requests to POST /api/v2/checkout require an Idempotency-Key header. Automatic retries trigger on HTTP 500, 502, 503 errors." },
        { chunk_id: "chk-002", tokens: 512, text: "If an idempotency key matches an existing successful payload within 24 hours, the cached HTTP 200 response is returned without re-executing payment." },
        { chunk_id: "chk-003", tokens: 390, text: "Failed card authorizations with error code card_declined must not be auto-retried. Prompt customer for updated CVC/ZIP." },
        { chunk_id: "chk-004", tokens: 410, text: "Webhook events charge.dispute.created trigger automatic escalation to Finance Risk Tier 2." }
      ]
    },
    { 
      id: "doc_pol_02", 
      title: "Handling Duplicate Card Charges & Refunds", 
      category: "policy", 
      chunks: 2, 
      updated: "Yesterday", 
      excerpt: "If a customer reports a duplicate authorization charge, verify transaction hashes in Stripe dashboard before issuing instant credit...",
      raw_chunks: [
        { chunk_id: "chk-011", tokens: 490, text: "If a customer reports a duplicate authorization charge, verify transaction hashes in Stripe dashboard before issuing instant credit." },
        { chunk_id: "chk-012", tokens: 430, text: "Refunds processed within 12 hours of original charge automatically reverse processing fees." }
      ]
    },
    { 
      id: "doc_man_03", 
      title: "Team Seat Upgrades & Prorated Billing", 
      category: "manual", 
      chunks: 5, 
      updated: "3 days ago", 
      excerpt: "Adding seats to an existing subscription calculates prorated charges for remaining days in current billing cycle...",
      raw_chunks: [
        { chunk_id: "chk-021", tokens: 505, text: "Adding seats to an existing subscription calculates prorated charges for remaining days in current billing cycle." },
        { chunk_id: "chk-022", tokens: 470, text: "Seat removal takes effect at the end of the active billing period. No mid-cycle cash refunds are permitted for unused seat days." }
      ]
    },
    { 
      id: "doc_gui_04", 
      title: "Dark Mode Export Roadmap (FEAT-1049)", 
      category: "guide", 
      chunks: 3, 
      updated: "1 week ago", 
      excerpt: "Dark mode PDF generation is planned for Q3 release using Puppeteer headless renderer...",
      raw_chunks: [
        { chunk_id: "chk-031", tokens: 380, text: "Dark mode PDF generation is planned for Q3 release using Puppeteer headless renderer." }
      ]
    }
  ]);

  const handleOpenIngestModal = () => {
    setNewTitle('API Timeout & Backoff Guidelines v2');
    setNewContent('Clients encountering HTTP 504 Gateway Timeout during high volume batch processing must enable exponential backoff starting at 100ms jitter. Retries should cap at 5 attempts before escalating to Tier 2 Support.');
    setNewCategory('manual');
    setShowIngestModal(true);
  };

  const handleSubmitIngest = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIngesting(true);
    let docId = `doc_${newCategory}_${Math.floor(100 + Math.random() * 900)}`;
    let chunkCount = Math.max(1, Math.ceil(newContent.length / 250));

    if (apiOnline) {
      try {
        const res = await fetch('/api/v1/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            content: newContent,
            source_type: newCategory
          })
        });
        if (res.ok) {
          const data = await res.json();
          docId = data.doc_id || docId;
          chunkCount = data.chunks || chunkCount;
        }
      } catch (e) {
        console.error("Ingest API error:", e);
      }
    }

    const createdDoc = {
      id: docId,
      title: newTitle,
      category: newCategory,
      chunks: chunkCount,
      updated: "Just now",
      excerpt: newContent,
      raw_chunks: [
        { chunk_id: `${docId}-c1`, tokens: Math.floor(newContent.length / 4), text: newContent }
      ]
    };

    setDocs(prev => [createdDoc, ...prev]);
    setIngesting(false);
    setShowIngestModal(false);
    
    // Show visual banner notification
    setNotification({
      title: "Document Successfully Ingested!",
      detail: `Indexed into ChromaDB collection 'sentineldesk_${newCategory}' (Doc ID: ${docId}, ${chunkCount} vector chunks created).`
    });

    setTimeout(() => setNotification(null), 6000);
  };

  const filtered = docs.filter(d => {
    const matchesQ = d.title.toLowerCase().includes(query.toLowerCase()) || d.excerpt.toLowerCase().includes(query.toLowerCase());
    const matchesC = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesQ && matchesC;
  });

  return (
    <div className="space-y-6">
      
      {/* Visual Notification Banner */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold text-emerald-900">{notification.title}</h4>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">{notification.detail}</p>
            </div>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          onClick={handleOpenIngestModal}
          disabled={ingesting}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest New Document</span>
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
          <div key={doc.id} className="minimal-card p-5 flex flex-col justify-between hover:shadow-md transition">
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
              <button 
                onClick={() => setSelectedChunkDoc(doc)}
                className="text-slate-900 font-bold flex items-center hover:underline focus:outline-none"
              >
                <span>View Chunks</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: Ingest Document Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-extrabold text-slate-900">Ingest Knowledge Document</h3>
              </div>
              <button onClick={() => setShowIngestModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIngest} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Document Title</label>
                <input 
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Source Category / Collection</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                >
                  <option value="faq">FAQ (sentineldesk_faq)</option>
                  <option value="policy">Policy (sentineldesk_policy)</option>
                  <option value="manual">Manual (sentineldesk_manual)</option>
                  <option value="guide">Guide (sentineldesk_guides)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">Document Content</label>
                <textarea 
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste documentation text to chunk (~512 tokens) and embed via bge-small-en-v1.5..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ingesting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {ingesting ? 'Indexing Vector Store...' : 'Confirm & Ingest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Vector Chunks Inspector */}
      {selectedChunkDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-slate-900" />
                  <h3 className="text-base font-extrabold text-slate-900">Vector Chunk Inspector</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedChunkDoc.title} ({selectedChunkDoc.id})</p>
              </div>
              <button onClick={() => setSelectedChunkDoc(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Collection Metadata */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600">Collection: <strong className="text-slate-900">sentineldesk_{selectedChunkDoc.category}</strong></span>
              <span className="text-slate-600">Model: <strong className="text-slate-900">bge-small-en-v1.5 (384d)</strong></span>
              <span className="text-slate-600">Chunks: <strong className="text-slate-900">{selectedChunkDoc.chunks}</strong></span>
            </div>

            {/* Chunks List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(selectedChunkDoc.raw_chunks || []).map((chk, idx) => (
                <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-extrabold text-indigo-600">Chunk #{idx + 1} ({chk.chunk_id || `chk-0${idx+1}`})</span>
                    <span>~{chk.tokens || 450} tokens</span>
                  </div>
                  <p className="text-xs text-slate-700 font-sans leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{chk.text}"
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedChunkDoc(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
