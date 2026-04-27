"""OpenRouter API client for making LLM requests."""

import asyncio
from typing import Any, Dict, List, Optional

import httpx

from .settings import settings


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 120.0,
    extra_params: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.

    Args:
        extra_params: Optional extra fields merged into the request body
                      (e.g. reasoning_enabled, thinkingConfig for specific models).

    Returns:
        Response dict with 'content' and optional 'reasoning_details', or None if failed.
    """
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }

    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
    }

    if extra_params:
        payload.update(extra_params)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                settings.openrouter_api_url,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()

            data = response.json()
            message = data["choices"][0]["message"]

            return {
                "content": message.get("content"),
                "reasoning_details": message.get("reasoning_details"),
            }

    except Exception as e:
        print(f"Error querying model {model}: {e}")
        return None


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
    model_params: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        model_params: Optional dict mapping model IDs to per-model extra params.
    """
    params = model_params or {}
    tasks = [
        query_model(model, messages, extra_params=params.get(model))
        for model in models
    ]
    responses = await asyncio.gather(*tasks)
    return {model: response for model, response in zip(models, responses)}
