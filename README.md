# EstateOS

Operational AI platform for real-estate agencies. Voice-first reporting, AI narrator for management, post-sale CRM, and SPIN sales training.

> **Status:** Phase 0 bootstrap. See `docs/superpowers/specs/` for product roadmap.

## Tech stack

Next.js 15 + React 19 + TypeScript · Drizzle ORM + PostgreSQL · Better-Auth · Deepgram + kimi-k2 + ElevenLabs · Docker + nginx-proxy

## Development

Requires Node 22+, pnpm 9+, Docker.

```bash
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

## Project layout

- `apps/web` — Next.js full-stack app
- `packages/db` — Drizzle schema + migrations
- `packages/auth` — Better-Auth setup
- `packages/ai` — STT/TTS/LLM clients
- `packages/notifications` — multi-channel cascade

## Canon

See `AGENTS.md` for agent rules, `CLAUDE.md` for Claude Code specifics.
