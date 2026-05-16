# EstateOS — CLAUDE.md (Claude Code wrapper)

> **Канон в [`AGENTS.md`](AGENTS.md)** — читай первым.

## Claude Code-специфика

### Skills

- `superpowers:*` — brainstorming, writing-plans, executing-plans, debugging
- `ris-claude-code:*` — Personal Corp framework
- `andrej-karpathy-skills:karpathy-guidelines` — rule 3 surgical changes
- `frontend-design:frontend-design` — для polish мокапов

### Memory rules (project-scoped)

Будут добавлены в `~/.claude/projects/-mnt-apps-estateos/memory/`:
- `feedback_no_admin_names_in_ui`
- `feedback_no_partner_word_in_ai`
- `feedback_svg_only_icons`
- `feedback_tts_switchable`
- `reference_voxium_canon_legacy`

### TrueNAS restrictions (см. `~/.claude/CLAUDE.md`)

- `/home` noexec — gh binary через `/mnt/apps/hq/bin/gh`
- `/opt` read-only
- xray proxy `127.0.0.1:10809` для ElevenLabs (блокирует РФ)
- chrome-cdp container на port 9222 для Playwright в Phase 7

### Codex CLI invocation

```bash
codex --skill codex-implementer --prompt "$(cat plan-chunk-N.md)" \
  --worktree /tmp/estateos-chunk-N
```

См. `/mnt/apps/hq/AGENTS.md` §Codex CLI config.
