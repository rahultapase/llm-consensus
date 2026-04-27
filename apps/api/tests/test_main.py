from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_models_endpoint_returns_presets(client: TestClient) -> None:
    response = client.get("/api/models")

    assert response.status_code == 200
    body = response.json()
    assert body["default_preset"] == "fast"
    assert "fast" in body["presets"]
    assert "reasoning" in body["presets"]


def test_council_stream_requires_auth(client: TestClient) -> None:
    response = client.post("/api/council/stream", json={"content": "hello"})

    assert response.status_code == 401