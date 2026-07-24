"""
SentinelDesk — LLM Provider Abstraction
Single entry point for all LLM calls — swappable between Gemini, Groq, and OpenRouter
via the LLM_PROVIDER env var. All calls go through the circuit breaker.
"""

from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional, Type

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from pydantic import BaseModel

from backend.core.circuit_breaker import llm_circuit_breaker
from backend.core.config import LLMProvider, settings
from backend.core.logging import get_logger

logger = get_logger(__name__)


def _build_llm() -> BaseChatModel:
    """Build and return the LangChain chat model for the configured provider."""
    provider = settings.LLM_PROVIDER

    if provider == LLMProvider.GEMINI:
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.LLM_API_KEY,
            temperature=0,
            request_timeout=settings.LLM_TIMEOUT_SECONDS,
            convert_system_message_to_human=True,
        )

    elif provider == LLMProvider.GROQ:
        from langchain_groq import ChatGroq

        return ChatGroq(
            model=settings.LLM_MODEL,
            groq_api_key=settings.LLM_API_KEY,
            temperature=0,
            request_timeout=settings.LLM_TIMEOUT_SECONDS,
        )

    elif provider == LLMProvider.OPENROUTER:
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.LLM_MODEL,
            openai_api_key=settings.LLM_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0,
            request_timeout=settings.LLM_TIMEOUT_SECONDS,
        )

    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")


# Lazy singleton — created on first use
_llm_instance: Optional[BaseChatModel] = None


def get_llm() -> BaseChatModel:
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = _build_llm()
    return _llm_instance


async def invoke_llm_structured(
    messages: List[BaseMessage],
    output_schema: Type[BaseModel],
    node_name: str = "unknown",
) -> BaseModel:
    """
    Invoke the LLM with structured output (schema-validated via Pydantic).
    Wrapped in the circuit breaker. Raises on failure — callers handle retry/escalation.
    """
    llm = get_llm()
    structured_llm = llm.with_structured_output(output_schema)

    async def _call() -> BaseModel:
        return await asyncio.get_event_loop().run_in_executor(
            None, structured_llm.invoke, messages
        )

    result = await llm_circuit_breaker.call(_call)
    logger.info(
        f"llm_call_success node={node_name} schema={output_schema.__name__}",
        extra={"node_name": node_name},
    )
    return result


class LLMClient:
    """High-level LLM Client interface used by agent nodes."""
    
    async def generate_structured_output(
        self,
        prompt: str,
        schema: Type[BaseModel],
        system_instruction: str = "",
    ) -> BaseModel:
        messages = [
            SystemMessage(content=system_instruction),
            HumanMessage(content=prompt),
        ]
        return await invoke_llm_structured(messages=messages, output_schema=schema)


_client_instance: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    global _client_instance
    if _client_instance is None:
        _client_instance = LLMClient()
    return _client_instance
