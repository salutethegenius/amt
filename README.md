# Golden Starter (Verity Application Framework)

Clone this template to start new projects with zero setup. See [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) for philosophy and stack defaults.

## Prerequisites

- Node 20+
- Python 3.11+
- Optional: Docker (for one-command run)

## Quick start

### 1. Copy env and fill Supabase (required for auth)

```bash
cp .env.example .env
# Edit .env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project (Connect > Next.js)
```

### 2. Run with Docker (easiest — both frontend and backend)

```bash
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:3000 (or next available port)  
- API: http://localhost:8000  
- Health: http://localhost:8000/health  

You can use placeholder Supabase values to run; auth will fail until you set a real project.

### 3. Run locally (dev)

**Terminal 1 — web**

```bash
cd apps/web
npm install
npm run dev
```

**Terminal 2 — API**

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment variables

| Variable | Service | Required | Notes |
|----------|---------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | web | Yes (for auth) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | Yes (for auth) | Supabase anon/publishable key |
| `NEXT_PUBLIC_API_URL` | web | No | Defaults to `http://localhost:8000` |
| `CORS_ORIGINS` | api | No | Comma-separated origins. Defaults to `http://localhost:3000,http://localhost:3001` |
| `OPENAI_API_KEY` / `LLM_API_KEY` | api | Optional | For AI features |
| `QDRANT_URL` / `QDRANT_API_KEY` | api | Optional | For vector search (see docker-compose commented section) |

## Notes

- Protected routes use Next.js `proxy.ts` (`apps/web/src/proxy.ts`) to refresh Supabase auth and guard `/dashboard`.
- `src/lib/api.ts` includes Zod-validated API response examples with explicit HTTP error handling.

## Deploy

- **Vercel**: Connect repo, set root to `apps/web`, add env vars from `.env.example`.
- **Railway**: Add two services (or one); build from `apps/api` and optionally `apps/web`; set env from `.env.example`.
- **Docker**: Build `apps/web` and `apps/api` images and run on any VM; use the same env vars.

## Repo structure

```
apps/web     — Next.js (TypeScript, Tailwind, Zod, Supabase auth)
apps/api     — FastAPI (app/, health, example route, optional AI stubs)
packages/    — Shared code (config, ui, utils) — optional helpers included
docs/        — PHILOSOPHY.md and standards
```

## Starting a new project from this template

1. Clone this repo (or use your Gitea/GitHub “use template”).
2. `rm -rf .git && git init` and push to your new repo.
3. Update app name, env, and features. Keep the architecture.
