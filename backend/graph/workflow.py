"""
SentinelDesk — LangGraph Multi-Agent Workflow State Machine.
Defines the executable state graph connecting all 7 agent nodes:
Intake → Intent → Urgency → Duplicate → RAG → Resolution → Decision → END
"""

from typing import Dict, Any

from langgraph.graph import END, StateGraph

from backend.agents.agentic_loop import agentic_react_node
from backend.agents.cost_agent import cost_node
from backend.agents.csat_agent import csat_node
from backend.agents.decision_node import decision_node
from backend.agents.duplicate_agent import duplicate_node
from backend.agents.intake_agent import intake_node
from backend.agents.intent_agent import intent_node
from backend.agents.rag_agent import rag_node
from backend.agents.resolution_agent import resolution_node
from backend.agents.translation_agent import translation_intake_node, translation_outbound_node
from backend.agents.urgency_agent import urgency_node
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)


def route_resolution(state: TicketState) -> str:
    """Conditional edge: Loops back to RAG step if resolution confidence is low (< 0.60)."""
    confidence = state.get("resolution_confidence", 1.0)
    retry_count = state.get("rag_retry_count", 0)

    if confidence < 0.60 and retry_count < 2:
        logger.info(f"Dynamic loopback: Resolution confidence ({confidence:.2f}) < 0.60. Retrying RAG node (attempt {retry_count + 1}).")
        return "rag_step"
    return "csat_step"


def build_sentineldesk_graph():
    """Constructs and compiles the LangGraph StateGraph."""
    workflow = StateGraph(TicketState)

    # 1. Add all 12 Nodes (including Multi-Lingual Translation Nodes)
    workflow.add_node("intake_step", intake_node)
    workflow.add_node("translation_intake_step", translation_intake_node)
    workflow.add_node("intent_step", intent_node)
    workflow.add_node("urgency_step", urgency_node)
    workflow.add_node("duplicate_step", duplicate_node)
    workflow.add_node("agentic_step", agentic_react_node)
    workflow.add_node("rag_step", rag_node)
    workflow.add_node("resolution_step", resolution_node)
    workflow.add_node("csat_step", csat_node)
    workflow.add_node("cost_step", cost_node)
    workflow.add_node("translation_outbound_step", translation_outbound_node)
    workflow.add_node("decision_step", decision_node)

    # 2. Wire Linear & Conditional Edges
    workflow.set_entry_point("intake_step")
    workflow.add_edge("intake_step", "translation_intake_step")
    workflow.add_edge("translation_intake_step", "intent_step")
    workflow.add_edge("intent_step", "urgency_step")
    workflow.add_edge("urgency_step", "duplicate_step")
    workflow.add_edge("duplicate_step", "agentic_step")
    workflow.add_edge("agentic_step", "rag_step")
    workflow.add_edge("rag_step", "resolution_step")
    
    # Dynamic loopback conditional edge: Resolution -> RAG or CSAT
    workflow.add_conditional_edges("resolution_step", route_resolution)
    workflow.add_edge("csat_step", "cost_step")
    workflow.add_edge("cost_step", "translation_outbound_step")
    workflow.add_edge("translation_outbound_step", "decision_step")
    workflow.add_edge("decision_step", END)

    app = workflow.compile()
    logger.info("LangGraph SentinelDesk multi-agent workflow compiled successfully.")
    return app


# Singleton graph instance
graph_app = build_sentineldesk_graph()


async def run_ticket_triage_graph(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    """Runner wrapper to execute the compiled graph on a ticket payload."""
    final_state = await graph_app.ainvoke(initial_state)
    return final_state
