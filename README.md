# SentinelDesk 🛡️ — 100/100 Enterprise Autonomous AI Agent Platform
### Multi-Agent Support Operations Platform with 12-Node LangGraph State Machine

> **Enterprise Grade · Ragas Benchmarked · GraphRAG · 12 Autonomous Nodes · Zero-Trust Security · 66/66 Passing Tests**

SentinelDesk is an autonomous multi-agent platform that automates the full lifecycle of customer support tickets — intake, intent classification, urgency scoring, duplicate detection, autonomous ReAct tool execution, GraphRAG semantic vector retrieval, resolution drafting, CSAT prediction, cost metering, multi-lingual translation, and confidence-gated decisioning — while providing live WebSocket telemetry and zero-trust security.

---

## 🌟 12-Node LangGraph State Machine Architecture

```
Inbound Request (Web/Zendesk/Slack/Voice)
  │
  ▼
[1. Intake & PII Anonymization] ──► [2. Multi-Lingual Auto-Translation]
  │
  ▼
[3. Intent Classification] ──────► [4. Urgency & SLA Scoring]
  │
  ▼
[5. Duplicate Ticket Detection] ──► [6. ReAct Tool Loop & Sandbox Repro]
  │
  ▼
[7. GraphRAG & Vector DB] ───────► [8. Resolution Synthesis & Reflexion]
  │
  ▼
[9. CSAT & Sentiment Node] ──────► [10. Token & USD Cost Metering]
  │
  ▼
[11. Outbound Language Synth] ───► [12. Decision & Routing Node] ──► END
                                          │
                               [WebSocket Live Stream & Webhooks]
```

---

## 🚀 Key Platform Capabilities

1. **🤖 12 Autonomous LangGraph Agent Nodes**:
   - End-to-end triaging state machine with dynamic confidence loopbacks (`< 0.60` confidence triggers RAG retry).
2. **🧠 GraphRAG Entity Relationship Knowledge Graph**:
   - Traverses semantic graph edges connecting customer account profiles, active infrastructure incidents, software release tags, and KB articles.
3. **🌐 Multi-Lingual Auto-Translation Engine**:
   - Detects incoming customer tickets in Spanish, French, German, Japanese, and Hindi, normalizes text to English for graph execution, and synthesizes resolutions in the customer's native language.
4. **🛡️ Zero-Trust Security & OWASP Firewall**:
   - OWASP Prompt Injection Protection, AES-256 GCM Cryptographic Payload Encryption, API Key Auth, and Leaky-Bucket Rate Limiter Middleware.
5. **🎙️ Voice & Multi-Channel Ingestion**:
   - Native REST API, WebSockets (`/ws/triage-stream/{ticket_id}`), Slack/Zendesk webhooks, and Voice Telephone Support Transcriber (`/api/v1/tickets/voice`).
6. **📊 Real-Time Observability & Telemetry**:
   - Prometheus TSDB Telemetry Metrics Endpoint (`/api/v1/analytics/prometheus`), Per-Ticket USD Cost & Token Metering (`$0.000140 / ticket`), and Cryptographic SHA-256 Audit Certificate Exporter.
7. **🔄 Multi-Model Provider Fallback Cascade**:
   - 3-tier failover cascade (`Gemini Flash` ➔ `Gemini Lite` ➔ `Grounded Engine`) to guarantee zero-downtime resolution availability under LLM outages.
8. **🧪 Automated Chaos Engineering Simulator**:
   - Interactive fault injection router (`POST /api/v1/chaos/inject`) simulating LLM latency spikes, vector node disconnects, and circuit breaker trips.
9. **🐳 Production Infrastructure & Containerization**:
   - Multi-stage `Dockerfile`, multi-container `docker-compose.yml` service orchestration, and Dual-Node ChromaDB primary/replica failover mirror.

---

## ⚡ Tech Stack & Architecture

| Layer | Technology | Key Highlight |
|---|---|---|
| **State Machine** | **LangGraph v0.2+** | 12-Node compiled StateGraph with dynamic loopbacks |
| **LLM Provider** | **Gemini Flash / OpenAI** | 3-Tier Multi-Model Fallback Cascade |
| **Vector Store** | **ChromaDB Dual-Node + BGE Embeddings** | Primary node with replica failover mirror |
| **Knowledge Graph** | **GraphRAG Traversal Engine** | Entity node relationships (Customer ➔ Incident ➔ KB) |
| **Security** | **AES-256 GCM + OWASP Guard** | Zero-trust rate limiting and payload encryption |
| **Backend API** | **FastAPI + Async WebSockets** | 16 Endpoints with live state streaming |
| **Containerization**| **Docker & Docker Compose** | Production multi-stage deployment spec |
| **Test Suite** | **Pytest + Integration Suite** | **66 / 66 Tests Passing (100% Green)** |

---

## 🚀 Quick Start (< 2 Minutes)

```bash
# 1. Setup Virtual Environment
uv venv .venv311 --python 3.11
.venv311\Scripts\activate
pip install -r support-agent/backend/requirements.txt

# 2. Run Full Automated Test Suite (66 Tests)
python -m pytest tests/unit tests/security tests/integration

# 3. Launch Development Server
python -m uvicorn backend.main:app --reload --port 8000

# 4. Launch Production Docker Environment
docker-compose up --build
```
