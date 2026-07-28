"""
SentinelDesk Agent — Per-Ticket LLM Token & USD Cost Metering Node.
Calculates token consumption and model inference cost per ticket.
"""

from datetime import datetime, timezone
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)

# Gemini Flash 2.5 Pricing: $0.075 / 1M prompt tokens, $0.30 / 1M completion tokens
PROMPT_COST_PER_TOKEN = 0.000000075
COMPLETION_COST_PER_TOKEN = 0.00000030


async def cost_node(state: TicketState) -> TicketState:
    subject = state.get("subject", "")
    body = state.get("body", "")
    draft = state.get("resolution_draft", "")

    # Estimate token counts (~4 chars per token)
    prompt_tokens = max(10, int(len(subject + body) / 4))
    completion_tokens = max(10, int(len(draft) / 4))
    total_tokens = prompt_tokens + completion_tokens

    # Calculate USD cost
    prompt_cost = prompt_tokens * PROMPT_COST_PER_TOKEN
    completion_cost = completion_tokens * COMPLETION_COST_PER_TOKEN
    estimated_cost_usd = round(prompt_cost + completion_cost, 6)

    audit_entry = {
        "step": "Cost Metering Node",
        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
        "detail": f"Inference Cost: ${estimated_cost_usd:.6f} ({total_tokens} tokens)",
        "status": "success",
    }

    trail = state.get("audit_trail", [])
    trail.append(audit_entry)

    logger.info(f"Cost metering node completed ticket={state.get('ticket_id')} tokens={total_tokens} cost=${estimated_cost_usd:.6f}")

    return {
        **state,
        "total_tokens": total_tokens,
        "estimated_cost_usd": estimated_cost_usd,
        "audit_trail": trail,
    }
