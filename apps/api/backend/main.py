"""FastAPI backend for LLM Consensus."""

import asyncio
import json
from typing import List, Optional

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .auth import verify_jwt
from .council import (
    calculate_aggregate_rankings,
    generate_conversation_title,
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final,
)
from .settings import settings

# Default model presets
MODEL_PRESETS = {
    "fast": {
        "council": [
            "openai/gpt-5.4-nano",
            "google/gemini-3.1-flash-lite-preview",
            "x-ai/grok-4.1-fast",
            "mistralai/mistral-small-2603",
        ],
        "chairman": "x-ai/grok-4.1-fast",
    },
    "reasoning": {
        "council": [
            "openai/gpt-4.1-mini",
            "google/gemini-2.5-flash-lite",
            "x-ai/grok-4.1-fast",
            "moonshotai/kimi-k2-thinking",
        ],
        "chairman": "x-ai/grok-4.1-fast",
    },
}

# Per-model extra params applied regardless of council mode.
ALWAYS_MODEL_PARAMS: dict[str, dict] = {}

# Extra request-body params injected ONLY when a model is used in Reasoning mode.
# Keys must match OpenRouter API parameter names.
REASONING_MODEL_PARAMS: dict[str, dict] = {
    "google/gemini-2.5-flash-lite": {
        "thinkingConfig": {"thinkingBudget": 5000},
    },
    "x-ai/grok-4.1-fast": {
        "reasoning_enabled": True,
    },
    "xiaomi/mimo-v2-flash": {
        "reasoning_enabled": True,
    },
}

app = FastAPI(title="LLM Consensus API", version=settings.app_version)

# Restricted CORS — specific origins only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# Track active streaming tasks for cancellation
_active_tasks: dict[str, asyncio.Task] = {}


class CouncilStreamRequest(BaseModel):
    """Request to run the council process."""
    content: str
    council_models: Optional[List[str]] = None
    chairman_model: Optional[str] = None
    preset: Optional[str] = "fast"
    conversation_id: Optional[str] = None
    council_mode: Optional[str] = None


class CancelRequest(BaseModel):
    """Request to cancel an active council stream."""
    task_id: str


# --- Public endpoints ---


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": settings.app_version}


@app.get("/api/models")
async def get_models():
    """Return available model presets and their configurations."""
    return {
        "presets": MODEL_PRESETS,
        "default_preset": "fast",
    }


# --- Authenticated endpoints ---


@app.post("/api/council/stream")
async def council_stream(
    request: CouncilStreamRequest,
    token: dict = Depends(verify_jwt),
):
    """
    Run the 3-stage council process and stream results via SSE.
    Requires valid Supabase JWT.
    """
    user_id = token.get("sub")

    # Resolve models from preset or request
    if request.council_models:
        council_models = request.council_models
        chairman_model = request.chairman_model or "x-ai/grok-4.1-fast"
    else:
        preset_name = request.preset or "fast"
        preset = MODEL_PRESETS.get(preset_name, MODEL_PRESETS["fast"])
        council_models = preset["council"]
        chairman_model = request.chairman_model or preset["chairman"]

    task_id = f"{user_id}:{id(request)}"

    # Build per-model extra params: always-on params merged with mode-specific params.
    # If both dicts have a key for the same model, reasoning params win (dict merge order).
    mode_params = REASONING_MODEL_PARAMS if request.council_mode == "reasoning" else {}
    model_params: dict[str, dict] | None = None
    all_keys = set(ALWAYS_MODEL_PARAMS) | set(mode_params)
    if all_keys:
        model_params = {
            m: {**ALWAYS_MODEL_PARAMS.get(m, {}), **mode_params.get(m, {})}
            for m in all_keys
        }

    async def event_generator():
        try:
            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(
                request.content, council_models, model_params=model_params
            )
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            if not stage1_results:
                yield f"data: {json.dumps({'type': 'error', 'message': 'All models failed to respond.'})}\n\n"
                return

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(
                request.content, stage1_results, council_models, model_params=model_params
            )
            aggregate_rankings = calculate_aggregate_rankings(
                stage2_results, label_to_model
            )
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(
                request.content, stage1_results, stage2_results, chairman_model
            )
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Generate title if this is for a new conversation
            if request.conversation_id:
                title = await generate_conversation_title(request.content)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except asyncio.CancelledError:
            yield f"data: {json.dumps({'type': 'cancelled'})}\n\n"
        except Exception:
            # Do not leak internal exception details to client
            yield f"data: {json.dumps({'type': 'error', 'message': 'An internal error occurred.'})}\n\n"
        finally:
            _active_tasks.pop(task_id, None)

    gen = event_generator()

    # Wrap in a task for cancellation support
    async def tracked_generator():
        async for chunk in gen:
            yield chunk

    return StreamingResponse(
        tracked_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Task-Id": task_id,
        },
    )


@app.post("/api/council/cancel")
async def cancel_council(
    request: CancelRequest,
    token: dict = Depends(verify_jwt),
):
    """Cancel an active council streaming task."""
    user_id = token.get("sub")

    # Ensure user can only cancel their own tasks
    if not request.task_id.startswith(f"{user_id}:"):
        return {"cancelled": False, "reason": "Not your task"}

    task = _active_tasks.get(request.task_id)
    if task and not task.done():
        task.cancel()
        return {"cancelled": True}

    return {"cancelled": False, "reason": "Task not found or already completed"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.port)
