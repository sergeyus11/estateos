# EstateOS — CLAUDE.md (Claude Code wrapper)

> ⚠ Пересмотрено 23.09.2026, решение CEO (sergeyus11/hq#1591, dev-workflow v2): код пишет Claude сам в worktree; `codex-implementer` — только запас (gpt-6-sol medium); ревью стадии 1 — `codex-reviewer` на gpt-6-sol high, Astra и Terra выключены; стадия 2 Claude — только ветки с признаками риска (деньги, 1С, прод-данные, права, стык репо, интеграции). Канон — `/mnt/apps/hq/AGENTS.md § Роли`, процедура — скилл `dev-workflow`. Упоминания Terra, Astra и делегирования Codex ниже — история до этой даты.

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
