import importlib
import sys

import pytest
from fastapi.testclient import TestClient


def _reload_backend() -> None:
    for module_name in [
        "backend.settings",
        "backend.openrouter",
        "backend.council",
        "backend.auth",
        "backend.main",
    ]:
        sys.modules.pop(module_name, None)


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv(
        "SUPABASE_JWKS_URL",
        "https://example.supabase.co/auth/v1/.well-known/jwks.json",
    )

    _reload_backend()
    app = importlib.import_module("backend.main").app

    with TestClient(app) as test_client:
        yield test_client