FROM python:3.10-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency metadata first for better layer caching
COPY pyproject.toml uv.lock .python-version ./
COPY backend/ backend/

# Install dependencies
RUN uv sync --locked --no-dev --no-install-project

# Expose port
EXPOSE 8001

# Run the application
CMD ["/app/.venv/bin/python", "-m", "backend.main"]
