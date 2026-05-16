# EstateOS — AGENTS.md

> Канон для всех агентов (Claude Code, Codex CLI). Single source of truth.
> Парный файл: [CLAUDE.md](CLAUDE.md) — Claude Code-специфика.
> Старший канон штаба: [`/mnt/apps/hq/AGENTS.md`](file:///mnt/apps/hq/AGENTS.md).

## Что это за репо

EstateOS — operational AI platform для агентств недвижимости. Standalone-продукт, spin-off из voxium. Сусанна — design-partner, её комната как design-feedback inbox остаётся в voxium `suom.voxium.ru`.

## Стэк

Next.js 15 App Router + React 19 + TypeScript + Tailwind v4 · Drizzle ORM + PostgreSQL 16 · Better-Auth · Deepgram nova-3 (Phase 1) · OpenRouter (kimi-k2/opus/sonnet, Phase 1+) · ElevenLabs (primary TTS, Phase 2) + OpenAI tts-1 (fallback) · pnpm 9 + Turborepo · Docker + nginx-proxy · pg_dump daily backup (Phase 0) → pgBackRest (Phase 1+).

## Правила проекта

### Никаких личных имён admin'ов в UI/email/messages
Только имя Organization. Multi-tenant-safe из коробки.

### Никакого слова «партнёр» в user-visible AI output
Rule зафиксирован для всего штаба, применяется и здесь.

### SVG-only иконки (Lucide / Feather inline)
Никаких emoji в шаблонах/UI/мокапах.

### TTS abstraction (Phase 2+)
Switchable через `TTS_PRIMARY=elevenlabs|openai`. Логировать каждую генерацию в `tts_calls` для cost/quality аналитики.

### Multi-tenant с миграции №1
Все таблицы имеют `organizationId` FK (text). Schema готова к 2-й org без миграций.

### Better-Auth canonical PKs
ID columns у `users`, `sessions`, `verification_tokens`, `organizations` — **text** (not uuid). Better-Auth gen'ит string PKs. Учитывай в seed/queries.

### Tests must hit real DB
Не мокать DB. Use scoped cleanup.

### Деплой
- nginx-proxy: `/mnt/apps/nginx-proxy/nginx/sites-available/estateos.ru`
- Container: `estateos_web` host port **30220** (30200 conflict с voxium-finsp2)
- DB: `estateos_db` host port 30210
- Backups: `/mnt/backup/estateos/daily/` + log `/mnt/backup/estateos/log/`

## Codex CLI config

См. `/mnt/apps/hq/AGENTS.md` §Codex CLI config. Tldr:
- `reasoning_effort=high`
- worktree isolation для каждой задачи
- subagent `codex-implementer` принимает задачу + spec/plan, возвращает diff
- subagent `codex-reviewer` для финального review (read-only)
- Spec-review между ними — Opus

## Workflow

1. Spec → `hq/docs/superpowers/specs/YYYY-MM-DD-...md`
2. Plan → `hq/docs/superpowers/plans/YYYY-MM-DD-...md` (Phase 0) или `docs/superpowers/plans/` (Phase 1+)
3. Issue в `sergeyus11/estateos` (epic + chunks как sub-issues)
4. Worktree per chunk: `git worktree add /tmp/estateos-chunk-N feature/chunk-N`
5. Codex-implementer executes, opens PR
6. Code-review (Opus + codex-reviewer)
7. Merge to main, deploy via `docker compose up -d --build web`
8. Smoke E2E против `https://estateos.ru/`

## Linked specs

- Roadmap: `hq/docs/superpowers/specs/2026-05-16-estateos-product-roadmap-design.md`
- Phase 0: `hq/docs/superpowers/plans/2026-05-16-estateos-phase-0-bootstrap.md`
