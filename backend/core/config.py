"""
SentinelDesk — Core Configuration
All environment variables loaded via pydantic-settings.
Missing required variables cause a loud startup failure — no silent defaults for secrets.
"""

from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LLMProvider(str, Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    OPENROUTER = "openrouter"


class RateLimitTier(str, Enum):
    FREE = "free"
    STANDARD = "standard"
    ENTERPRISE = "enterprise"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── LLM Provider ──────────────────────────────────────────────────────────
    LLM_PROVIDER: LLMProvider = Field(
        ...,
        description="LLM provider to use: gemini | groq | openrouter",
    )
    LLM_API_KEY: str = Field(
        ...,
        description="API key for the selected LLM provider. Never hardcoded.",
    )
    LLM_MODEL: str = Field(
        default="gemini-2.0-flash",
        description="Model name/ID on the provider.",
    )
    LLM_TIMEOUT_SECONDS: int = Field(
        default=30,
        description="Timeout (seconds) for each LLM call before circuit-breaker escalation.",
    )
    LLM_CIRCUIT_BREAKER_THRESHOLD: int = Field(
        default=3,
        description="Consecutive LLM failures before circuit breaker opens.",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        ...,
        description="SQLAlchemy database URL. e.g. sqlite:///./sentineldesk.db",
    )

    # ── ChromaDB ──────────────────────────────────────────────────────────────
    CHROMADB_PATH: str = Field(
        ...,
        description="Filesystem path where ChromaDB persists its data.",
    )

    # ── Auth & Security ───────────────────────────────────────────────────────
    JWT_SECRET: str = Field(
        ...,
        description="Secret key for signing JWTs. Must be cryptographically random.",
    )
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Keep as str — pydantic-settings v2 would try JSON-decode on List[str].
    # The validator below splits on commas to produce a list.
    ALLOWED_ORIGINS: str = Field(
        ...,
        description="Comma-separated CORS origins. E.g. http://localhost:5173,https://app.com",
    )

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_TIER: RateLimitTier = Field(
        default=RateLimitTier.FREE,
        description="Default rate-limit tier applied to API keys without an explicit tier.",
    )
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(
        default=60,
        description="Requests per minute per IP/API-key (token bucket refill rate).",
    )

    # ── Cost / Token Ceilings ─────────────────────────────────────────────────
    MAX_TOKENS_PER_TICKET: int = Field(
        default=4096,
        description="Hard token ceiling per ticket processing run.",
    )
    MAX_DAILY_COST_USD: float = Field(
        default=5.0,
        description="Hard daily LLM cost ceiling. Triggers circuit-breaker to fallback.",
    )

    # ── Confidence Thresholds ─────────────────────────────────────────────────
    CONFIDENCE_THRESHOLD: float = Field(
        default=0.75,
        description="Minimum confidence to auto-close a ticket. Below this → human escalation.",
    )
    AUTO_SEND_CONFIDENCE_THRESHOLD: float = Field(
        default=0.95,
        description="Minimum confidence to auto-send resolution for whitelisted intents.",
    )

    # ── RAG ───────────────────────────────────────────────────────────────────
    RAG_TOP_K: int = Field(default=6, description="Number of chunks retrieved before reranking.")
    RAG_TOP_N: int = Field(default=3, description="Number of chunks kept after reranking.")
    RAG_CHUNK_SIZE: int = Field(default=512, description="Target chunk size in tokens.")
    RAG_CHUNK_OVERLAP: int = Field(default=77, description="Overlap tokens between chunks (~15%).")
    RAG_SIMILARITY_THRESHOLD: float = Field(
        default=0.3, description="Min similarity score; below this → no relevant knowledge."
    )

    # ── SSRF Allow-list ───────────────────────────────────────────────────────
    SSRF_ALLOWED_DOMAINS: str = Field(
        default="",
        description="Comma-separated domains the system may fetch externally.",
    )

    # ── Misc ──────────────────────────────────────────────────────────────────
    APP_ENV: str = Field(default="development", description="development | staging | production")
    LOG_LEVEL: str = Field(default="INFO")
    DUPLICATE_TICKET_SIMILARITY_THRESHOLD: float = Field(
        default=0.85,
        description="Vector similarity score above which two tickets are considered duplicates.",
    )
    WEBHOOK_SECRET: str = Field(
        default="",
        description="HMAC secret for validating inbound email-connector webhook calls.",
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS comma-string into a list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def ssrf_allowed_domains_list(self) -> List[str]:
        """Parse SSRF_ALLOWED_DOMAINS comma-string into a list."""
        return [d.strip() for d in self.SSRF_ALLOWED_DOMAINS.split(",") if d.strip()]

    @model_validator(mode="after")
    def validate_production_constraints(self) -> "Settings":
        if self.APP_ENV == "production":
            origins = self.allowed_origins_list
            if not origins:
                raise ValueError("ALLOWED_ORIGINS must be set in production.")
            if "*" in origins:
                raise ValueError("Wildcard '*' is not allowed in ALLOWED_ORIGINS for production.")
            if not self.WEBHOOK_SECRET:
                raise ValueError("WEBHOOK_SECRET must be set in production.")
        return self


# Singleton — import this everywhere
settings = Settings()  # type: ignore[call-arg]
