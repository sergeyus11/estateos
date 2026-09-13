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

Канон — `/mnt/apps/hq/AGENTS.md § Роли` и скилл `dev-workflow` (пересмотрено 13.09.2026, hq#1355):

- **Путь по цене ошибки:** spike (вопрос → ответ, без кода) · bounded (правка существующего: issue, дизайн в чате, «да» CEO) · architectural (новое, деньги, прод, права — спека и план). Классифицирует `superpowers:brainstorming`.
- **Исполнитель:** subagent `codex-implementer`, `gpt-5.6-terra`, effort **medium** явными флагами; механика и провенанс — `/mnt/apps/hq/bin/codex-run.sh` + `codex-commit.sh`, трейлеры только из связанного прогона.
- **Worktree обязателен:** `git worktree add .worktrees/codex-<slug> -b codex/<slug> origin/main` — только внутри репо, sibling-папки запрещены (hq#801).
- **Ревью — два, на ветке:** стадия 1 `codex-reviewer` (`gpt-6-astra` high, read-only, снимок head) → стадия 2 Claude свежим субагентом. Critical блокирует merge; третий круг фиксов — только цитатой CEO. Merge — только по «мержим».

## Workflow

1. Spec (только architectural) → `hq/docs/superpowers/specs/YYYY-MM-DD-...md`
2. Plan (только architectural) → `hq/docs/superpowers/plans/YYYY-MM-DD-...md` (Phase 0) или `docs/superpowers/plans/` (Phase 1+)
3. Issue в `sergeyus11/estateos`: architectural — эпик + нативные sub-issues; bounded — один issue, spec и plan не пишутся
4. Worktree на ветку: `git worktree add .worktrees/<slug> -b feature/<slug> origin/main` — один на задачу; `codex-implementer` работает в нём, отдельный `codex-<slug>` не заводить (канон `<repo>/.worktrees/<slug>`; `/tmp` noexec на TrueNAS)
5. `codex-implementer` по задаче, тесты вне sandbox
6. Два ревью ветки: `codex-reviewer` (Astra high) → Claude; PR с тремя следами
7. Merge по «мержим» CEO; deploy `docker compose up -d --build web` — только по «задеплой»
8. Smoke E2E против `https://estateos.ru/`

## Linked specs

- Roadmap: `hq/docs/superpowers/specs/2026-05-16-estateos-product-roadmap-design.md`
- Phase 0: `hq/docs/superpowers/plans/2026-05-16-estateos-phase-0-bootstrap.md`
