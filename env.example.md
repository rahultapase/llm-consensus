# env.example.md — Environment Variables

All variables needed for the current monorepo, split by service.

Use these files as the local starting point:

- `apps/web/.env.local` for the Next.js app
- `apps/web/.env.example` for the web placeholder template
- `apps/api/.env` for the FastAPI app
- `apps/api/.env.example` for the API placeholder template

For full production setup steps across Vercel, Railway, Supabase, and Google Cloud, use `deployment.md`.

---

## Next.js (`apps/web/.env.local`)

### Browser-safe (NEXT_PUBLIC_ prefix)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Server-only (NEVER prefix with NEXT_PUBLIC_)

```bash
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
FASTAPI_INTERNAL_URL=http://localhost:8001
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Notes:

- In production, `FASTAPI_INTERNAL_URL` must be the Railway public URL.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser.

---

## FastAPI (`apps/api/.env`)

### All server-only

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
CORS_ORIGINS=["http://localhost:3000"]
APP_VERSION=0.2.0
```

Optional only if the API later needs them operationally:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://...
PORT=8001
```

Notes:

- In production, `CORS_ORIGINS` must include the deployed frontend domain.
- Railway normally injects `PORT` automatically.

---

## Hard Rules

1. `OPENROUTER_API_KEY` stays in FastAPI only. The browser must never receive it.
2. `SUPABASE_SERVICE_ROLE_KEY` is server-only in both services and must never use a `NEXT_PUBLIC_` prefix.
3. All required vars should fail loudly when missing: Zod in the web app and Pydantic settings in the API.
4. Example files are placeholders only and must not contain live secrets.
