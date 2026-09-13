# EstateOS — CLAUDE.md (Claude Code wrapper)

> **Канон в [`AGENTS.md`](AGENTS.md)** — читай первым.

## Claude Code-специфика

### Skills

- `superpowers:*` — brainstorming, writing-plans, executing-plans, debugging
- `ris-claude-code:*` — Personal Corp framework
- `andrej-karpathy-skills:karpathy-guidelines` — rule 3 surgical changes
- `frontend-design:frontend-design` — для polish мокапов

### TrueNAS restrictions (см. `~/.claude/CLAUDE.md`)

- `/home` noexec — gh binary через `/mnt/apps/hq/bin/gh`
- `/opt` read-only
- xray proxy `127.0.0.1:10809` для ElevenLabs (блокирует РФ)
- chrome-cdp container на port 9222 для Playwright в Phase 7

### Codex CLI invocation

Имплементация — через subagent `codex-implementer` (не прямой вызов `codex`). Канон в [`/mnt/apps/hq/AGENTS.md`](file:///mnt/apps/hq/AGENTS.md) § Роли и в `AGENTS.md § Codex CLI config` этого репо.
