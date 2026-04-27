<div>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="apps/web/public/favicon.svg">
  <img src="apps/web/public/favicon.svg" width="40" alt="LLM Consensus logo" align="left">
</picture>
  <h1>&nbsp; LLM Consensus — Multi-Model Consensus Framework</h1>
  <p>Get a smarter answer by letting your LLMs debate it first.</p>

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit-4CAF50?style=for-the-badge&logo=vercel&logoColor=white)](https://llm-consensus-taupe.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## 📖 About
The idea of this repo is that instead of asking a question to your favorite LLM provider (e.g. OpenAI GPT, Google Gemini, xAI Grok, etc ), you can group them into your "LLM Council". Each model answers independently, critiques the others anonymously, and a designated chairman synthesizes the final response weighted by peer rankings.

## How it works

A single query runs through three stages:

1. **Stage 1: First opinions**. The user query is given to all LLMs individually, and the responses are collected. The individual responses are shown in a "tab view", so that the user can inspect them all one by one.
2. **Stage 2: Review**. Each individual LLM is given the responses of the other LLMs. Under the hood, the LLM identities are anonymized so that the LLM can't play favorites when judging their outputs. The LLM is asked to rank them in accuracy and insight.
3. **Stage 3: Final response**. The designated Chairman of the LLM Council takes all of the model's responses and compiles them into a single final answer that is presented to the user.

## 🌐 Live Demo

Try it at **[llm-consensus-taupe.vercel.app](https://llm-consensus-taupe.vercel.app/)** — sign in with Google or email to get started.

## ✨ Features

- **Multi-model council** — choose 2–5 models from any OpenRouter provider
- **Model presets** — Fast (low-latency) and Reasoning (high-quality) lineups with per-conversation override
- **Real-time streaming** — all three stages stream progressively via Server-Sent Events
- **Rich rendering** — syntax-highlighted code, LaTeX math, Mermaid diagrams
- **Auth** — Google OAuth and email/password sign-in with per-user conversation history
- **Conversation management** — persistent history, search, delete, and starring
- **Dark / light mode**, keyboard shortcuts, command palette, and voice input
- **Temporary chat** — one-off sessions never saved to the database
- **Rate limiting** — per-user API limits via Upstash Redis

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui |
| API Layer | tRPC v11 · Next.js Route Handlers (SSE proxy) |
| State | Zustand · TanStack Query |
| Auth & DB | Supabase Auth · Supabase Postgres · Drizzle ORM |
| Backend | FastAPI · httpx · OpenRouter |
| Rate Limiting | Upstash Redis (`@upstash/ratelimit`) |
| Rendering | react-markdown · rehype-shiki · rehype-katex · Mermaid |
| Deploy | Vercel (web) · Railway (API) |

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- A [Supabase](https://supabase.com/) project
- An [OpenRouter](https://openrouter.ai/) API key
- An [Upstash](https://upstash.com/) Redis database

## 🚀 Getting Started

### 1. Install dependencies

```bash
# Python backend
cd apps/api && uv sync && cd ../..

# Next.js frontend
cd apps/web && npm install && cd ../..
```

### 2. Configure environment variables

**`apps/web/.env.local`**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
FASTAPI_INTERNAL_URL=http://localhost:8001
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**`apps/api/.env`**

```bash
OPENROUTER_API_KEY=sk-or-v1-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
CORS_ORIGINS=["http://localhost:3000"]
```

> [!NOTE]
> `SUPABASE_SERVICE_ROLE_KEY` and `OPENROUTER_API_KEY` must never be exposed to the browser.

### 3. Apply database migrations

Run the SQL files in `supabase/migrations/` against your Supabase project in order (`0001_` through `0006_`).

### 4. Start the development servers

```bash
# Terminal 1 — FastAPI (port 8001)
cd apps/api && uv run python -m backend.main

# Terminal 2 — Next.js (port 3000)
cd apps/web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🤖 Choosing Models

Council and chairman models are selected per conversation in the UI via the mode config dialog. Built-in presets:

| Preset | Models |
|---|---|
| **Fast** | GPT-4.1-nano · Gemini 3.1 Flash Lite · Grok 4.1 Fast · Mistral Small |
| **Reasoning** | GPT-4.1-mini · Gemini 2.5 Flash Lite · Grok 4.1 Fast · Kimi-K2-Thinking |

Any [OpenRouter model ID](https://openrouter.ai/models) is supported.

## 🚢 Deployment

The monorepo deploys to two platforms from a single Git repository:

- **Vercel** — Next.js app from `apps/web`. Set *Root Directory* to `apps/web` in the Vercel project settings.
- **Railway** — FastAPI from `apps/api` via Dockerfile. Configuration is in `apps/api/railway.toml`.

After deploying the API, update `FASTAPI_INTERNAL_URL` in Vercel to the Railway public URL, and add your Vercel deployment URL to `CORS_ORIGINS` in Railway.

## 📁 Project Structure

```
llm-consensus/
├── apps/
│   ├── api/                        # FastAPI backend (Railway)
│   │   └── backend/
│   │       ├── main.py             # FastAPI app + SSE endpoint
│   │       ├── council.py          # 3-stage orchestration logic
│   │       ├── openrouter.py       # OpenRouter API client (httpx)
│   │       ├── auth.py             # Supabase JWT verification
│   │       └── settings.py         # Env config (pydantic-settings)
│   ├── web/                        # Next.js 16 App Router (Vercel)
│   │   ├── app/
│   │   │   ├── (app)/              # Authenticated app shell
│   │   │   │   ├── c/              # Conversation routes
│   │   │   │   └── temp/           # Temporary (unsaved) chat
│   │   │   ├── (auth)/             # Login · Signup · Callback · Verify
│   │   │   └── api/                # Route Handlers (SSE proxy + tRPC)
│   │   ├── components/
│   │   │   ├── chat/               # Message input, list, scroll, voice
│   │   │   ├── council/            # Stage 1/2/3, model picker, presets
│   │   │   ├── layout/             # Sidebar, header, shell, search bar
│   │   │   ├── markdown/           # Code, math, Mermaid renderers
│   │   │   └── ui/                 # shadcn/ui primitives
│   │   ├── lib/
│   │   │   ├── db/                 # Drizzle ORM schema + queries
│   │   │   ├── stores/             # Zustand global state
│   │   │   ├── supabase/           # Supabase client (server & browser)
│   │   │   ├── hooks/              # Shared React hooks
│   │   │   └── streaming/          # SSE consumer helpers
│   │   └── trpc/                   # tRPC routers + client setup
├── packages/
│   └── shared/                     # Shared Zod schemas + TypeScript types
└── supabase/
    └── migrations/                 # Ordered SQL files (0001–0006)
```

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

Please check [open issues](https://github.com/rahultapase/llm-consensus/issues) before starting work on something new.

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? Please [open an issue](https://github.com/rahultapase/llm-consensus/issues) — include steps to reproduce for bugs.

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## ⭐ Support

If you find this project helpful, please give it a star! It helps others discover the project.

---

<div>
  <sub>© 2026 LLM Consensus. All rights reserved.</sub>
</div>