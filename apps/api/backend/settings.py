"""Application settings with env validation — crashes loud on missing vars."""

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # OpenRouter
    openrouter_api_key: str = Field(..., description="OpenRouter API key")
    openrouter_api_url: str = Field(
        default="https://openrouter.ai/api/v1/chat/completions",
        description="OpenRouter API endpoint",
    )

    # Supabase (for JWT verification)
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_jwks_url: str = Field(..., description="Supabase JWKS endpoint URL")

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins",
    )

    # App
    app_version: str = Field(default="0.2.0", description="API version")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Crash on import if env vars missing — no silent fallbacks.
settings = Settings()
