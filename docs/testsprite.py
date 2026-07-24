"""
TestSprite integration notes for SentinelDesk.
==============================================
TestSprite is an AI-powered MCP testing tool that auto-generates and runs
pytest suites for FastAPI endpoints.

Setup:
1. Sign up at https://testsprite.com and get an API key.
2. Add your key to .cursor/mcp.json (already configured).
3. In Cursor/VS Code, prompt: "Help me test this project with TestSprite."

TestSprite will:
- Analyse all FastAPI routes (tickets, auth, knowledge, analytics, webhooks)
- Generate a pytest suite under tests/testsprite/
- Execute in a cloud sandbox and report failures with fix suggestions

Manual trigger (no MCP):
    npx -y @testsprite/testsprite-mcp@latest run --api-key YOUR_KEY --endpoint http://localhost:8000

Important: TestSprite tests the API surface. The tests in tests/unit/ and tests/security/
test the internal logic. Both layers are needed — they're complementary, not redundant.
"""
