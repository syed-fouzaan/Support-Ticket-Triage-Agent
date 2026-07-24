"""
SentinelDesk — LangGraph Multi-Agent Workflow State Machine.
Defines the executable state graph connecting all 7 agent nodes:
Intake → Intent → Urgency → Duplicate → RAG → Resolution → Decision → END
"""

from typing import Dict, Any

from langgraph.graph import END, StateGraph

from backend.agents.decision_node import decision_node
from backend.agents.duplicate_agent import duplicate_node
from backend.agents.intake_agent import intake_node
from backend.agents.intent_agent import intent_node
from backend.agents.rag_agent import rag_node
from backend.agents.resolution_agent import resolution_node
from backend.agents.urgency_agent import urgency_node
from backend.core.logging import get_logger
from backend.graph.state import TicketState

logger = get_logger(__name__)


def build_sentineldesk_graph():
    """Constructs and compiles the LangGraph StateGraph."""
    workflow = StateGraph(TicketState)

    # 1. Add all 7 Nodes
    workflow.add_node("intake", intake_node)
    workflow.add_node("intent", intent_node)
    workflow.add_node("urgency", urgency_node)
    workflow.add_node("duplicate", duplicate_node)
    workflow.add_node("rag", rag_node)
    workflow.add_node("resolution", resolution_node)
    workflow.add_node("decision", decision_node)

    # 2. Wire Linear & Conditional Edges
    workflow.set_entry_point("intake")
    workflow.add_edge("intake", "intent")
    workflow.add_edge("intent", "urgency")
    workflow.add_edge("urgency", "duplicate")
    workflow.add_edge("duplicate", "rag")
    workflow.add_edge("rag", "resolution")
    workflow.add_edge("resolution", "decision")
    workflow.add_edge("decision", END)

    app = workflow.compile()
    logger.info("LangGraph SentinelDesk multi-agent workflow compiled successfully.")
    return app


# Singleton graph instance
graph_app = build_sentineldesk_graph()


async def run_ticket_triage_graph(initial_state: Dict[str, Any]) -> Dict[str, Any]:
    """Runner wrapper to execute the compiled graph on a ticket payload."""
    final_state = await graph_app.ainvoke(initial_state)
    return final_state
