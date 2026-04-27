"""Supabase JWT verification via JWKS endpoint."""


import httpx
from fastapi import HTTPException, Request
from jose import JWTError, jwt

from .settings import settings

_jwks_cache: dict | None = None


async def _fetch_jwks() -> dict:
    """Fetch JWKS from Supabase. Cached after first call."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(settings.supabase_jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache


def _clear_jwks_cache():
    """Clear JWKS cache (for key rotation)."""
    global _jwks_cache
    _jwks_cache = None


async def verify_jwt(request: Request) -> dict:
    """
    Extract and verify the Supabase JWT from Authorization header.

    Returns the decoded token payload with at minimum 'sub' (user id).
    Raises HTTPException 401 on any failure.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ", 1)[1]

    try:
        jwks = await _fetch_jwks()

        # Get the key ID from the token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key in JWKS
        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = key
                break

        if rsa_key is None:
            # Key not found — maybe rotated. Clear cache and retry once.
            _clear_jwks_cache()
            jwks = await _fetch_jwks()
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    rsa_key = key
                    break

        if rsa_key is None:
            raise HTTPException(status_code=401, detail="Unable to find appropriate key")

        # Supabase uses ES256 (ECDSA) for newer JWT signing keys
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )
        return payload

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
