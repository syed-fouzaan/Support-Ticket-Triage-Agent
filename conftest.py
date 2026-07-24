"""
Root conftest — adds the project root to sys.path so `import backend.*` works.
ponytail: one conftest, no __init__.py needed in every test directory.
"""
import os
import sys
from pathlib import Path

# Make `backend` importable from any test
sys.path.insert(0, str(Path(__file__).parent))

# Inject test env vars BEFORE any backend module is imported.
# These are the minimum required by backend/core/config.py.
os.environ.setdefault("LLM_PROVIDER", "gemini")
os.environ.setdefault("LLM_API_KEY", "test-key")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("CHROMADB_PATH", "/tmp/chromadb_test")
os.environ.setdefault("JWT_SECRET", "test-secret-" + "a" * 40)
# ALLOWED_ORIGINS is a plain comma-separated str field (split to list via property)
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
