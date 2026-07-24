# SentinelDesk 🛡️
### Multi-Agent AI Customer Support Operations Platform

> **Portfolio-grade · Interview-grade · Production-grade**

SentinelDesk is a multi-agent, RAG-powered AI system that automates the full lifecycle of a customer support ticket — intake, intent classification, urgency scoring, duplicate detection, knowledge retrieval, resolution drafting, and escalation — while keeping a human agent in the loop via a real-time operations dashboard.

---

## What makes this different

Most candidate projects wire an LLM directly to an answer. SentinelDesk wires a **graph of specialized agents**, a governed knowledge base, a persistence layer, and a security boundary around every piece — so the system behaves predictably even when the LLM, the vector store, or the network misbehaves.

```
Ticket → [Intent Agent] → [Urgency Agent] → [Duplicate Search] → [RAG Retrieval]
       → [Resolution Agent] → [Confidence Gate] → Solved / Escalate → [Human Review]
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Orchestration | **LangGraph** | Explicit state machine, resumable, auditable |
| LLM | **Gemini 2.5 Flash / Groq / OpenRouter** | Free tier, swappable via env var |
| Embeddings | **bge-small-en-v1.5** | Local, free, no external API |
| Vector DB | **ChromaDB** | Embedded, zero-ops for demo |
| Relational DB | **SQLite → Postgres-ready** | Zero-ops demo, documented migration path |
| Backend | **FastAPI** | Async, Pydantic, auto OpenAPI |
| Frontend | **React + Vite + Tailwind** | Fast ops dashboard |
| Security | OWASP Top 10 + OWASP LLM Top 10 | Full mitigation per PRD Section 14 |

---

## Quick Start (< 2 minutes)

### Prerequisites
- Docker + Docker Compose installed and running
- A free API key from [Google AI Studio](https://aistudio.google.com/) (Gemini) or [Groq](https://console.groq.com)

### 1. Clone and configure

```bash
git clone https://github.com/syed-fouzaan/Support-Ticket-Triage-Agent.git
cd Support-Ticket-Triage-Agent
cp .env.example .env
# Edit .env and set LLM_API_KEY=your-key-here
```

### 2. Start everything

```bash
docker compose up --build
```

That's it. The backend starts at **http://localhost:8000**.

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Readiness: http://localhost:8000/api/v1/health/ready

### 3. Run tests

```bash
pip install pytest pytest-asyncio httpx aiosqlite pydantic pydantic-settings sqlalchemy spacy
pytest tests/ -v
```

---

## Architecture

### Agent Graph (LangGraph State Machine)

```
START
  └─► Receive Ticket (validate, sanitize, assign trace_id)
        └─► Parse Ticket (language detect, PII scan/redact)
              └─► Intent Node (Billing/TechBug/Feature/Account/General/Abuse)
                    └─► Urgency Node (Hot/Warm/Cold)
                          └─► Customer Lookup Node
                                └─► Duplicate Search Node
                                      └─► Retrieve Knowledge (RAG top-6 → rerank top-3)
                                            └─► Generate Response (grounded, schema-validated)
                                                  └─► Decision Node ──confidence ≥ 0.75 + no policy flag──► Close Ticket
                                                                    └─── else ──────────────────────────────► Escalate
                                                                    └─► Save → END
```

### Security Architecture

Every trust boundary is explicitly mitigated:

| Threat | Mitigation |
|---|---|
| Prompt injection | Ticket text treated as DATA, never instructions. Injection classifier flags suspicious tickets. |
| SSRF | All external fetches validated against RFC1918 + allow-list blocklist |
| PII in logs | Regex + NER redaction before any log/embed/store |
| Insecure LLM output | All LLM calls use structured output (Pydantic schema). Never regex-parsed. |
| Excessive agency | `email_customer` only accepts `ticket_id` — resolves address internally. Never a free-text address. |
| Confidence overreliance | Billing/legal/security topics **hardcoded** to force-escalate regardless of confidence score |
| Audit integrity | `ticket_audit_log` is append-only at ORM layer — no UPDATE/DELETE method exists anywhere |

### Failure Modes & Fallbacks

| Failure | Fallback |
|---|---|
| LLM API down | Circuit breaker opens → templated response + force-escalate |
| ChromaDB down | RAG node catches exception → escalate with "knowledge base unavailable" |
| Malformed LLM JSON | One retry with error fed back → escalate on second failure (never loops) |
| DB write failure | 503 + retry-after; ticket not marked processed until write confirmed |
| Rate limit exceeded | 429 with backoff header; token bucket per IP + per API key |

> **Interview tip:** Lead with the failure-mode demo — kill the LLM connection live and show the graceful fallback. Most candidates can show the happy path. Showing a designed failure response is the differentiator.

---

## Project Structure

```
support-agent/
├── backend/
│   ├── api/           # FastAPI routers (tickets, auth, knowledge, analytics, webhooks)
│   ├── agents/        # intake, intent, urgency, duplicate, rag, resolution, escalation
│   ├── graph/         # workflow.py — LangGraph state machine wiring
│   ├── tools/         # 8 tools, each with Pydantic input schema + least-privilege scope
│   ├── prompts/       # versioned system prompts per agent
│   ├── security/      # PII redaction, SSRF validator, injection classifier, auth
│   ├── vectordb/      # ChromaDB client, ingestion pipeline, retrieval, grounding checker
│   ├── database/      # SQLAlchemy models (8 tables), session, append-only audit log
│   └── core/          # config (pydantic-settings), logging, circuit breaker, LLM client
├── infra/             # Dockerfiles, nginx config, render.yaml
├── tests/
│   ├── unit/          # tool schemas, PII redaction, health endpoint
│   ├── security/      # prompt injection, SSRF, confidence gate
│   ├── integration/   # full graph runs against seeded DB + mock LLM
│   └── eval/          # 150+ labeled tickets, eval scorecard CI
├── docs/              # PRD, architecture diagrams, eval results
├── sample_tickets/    # demo + eval fixtures, knowledge base docs
├── .env.example       # all required env vars with documentation
├── docker-compose.yml # one-command local deploy
└── README.md
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | ✅ | `gemini` \| `groq` \| `openrouter` |
| `LLM_API_KEY` | ✅ | API key for the chosen provider |
| `DATABASE_URL` | ✅ | SQLAlchemy URL (sqlite or postgresql) |
| `CHROMADB_PATH` | ✅ | Filesystem path for ChromaDB persistence |
| `JWT_SECRET` | ✅ | 64-byte random hex string for JWT signing |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `CONFIDENCE_THRESHOLD` | — | Default `0.75` — below this, tickets escalate |
| `MAX_DAILY_COST_USD` | — | Default `5.0` — hard LLM cost ceiling |

See [`.env.example`](.env.example) for full reference.

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/tickets` | API key | Submit a new ticket |
| `GET` | `/api/v1/tickets/{id}` | API key | Get ticket + resolution |
| `GET` | `/api/v1/tickets` | JWT | List/filter tickets |
| `POST` | `/api/v1/tickets/{id}/approve` | JWT (agent) | Approve/edit AI resolution |
| `POST` | `/api/v1/tickets/{id}/escalate` | JWT (agent) | Manually escalate |
| `POST` | `/api/v1/knowledge` | JWT (admin) | Add/update knowledge doc |
| `GET` | `/api/v1/analytics/summary` | JWT | Dashboard metrics |
| `GET` | `/api/v1/health/live` | none | Liveness probe |
| `GET` | `/api/v1/health/ready` | none | Readiness probe |

Full OpenAPI schema at `/docs` when running locally.

---

## Built for Rooman Technologies

This project was designed and built as a portfolio demonstration for Rooman Technologies — showing production-grade multi-agent AI system design, security architecture, and reliability engineering.

**PRD:** `docs/PRD_SentinelDesk.docx`  
**Build prompt:** `docs/prompt.md`
