# Claude Code Hooks — PetPawSphere

This project uses [Claude Code hooks](https://docs.claude.com/en/docs/claude-code/hooks) to enforce team-wide standards on multi-agent workflows.

## Active hooks (team-shared)

### `UserPromptSubmit` → `toolkit-audit.py`

**File:** `.claude/hooks/toolkit-audit.py`
**Wired in:** `.claude/settings.json` (committed, team-shared)

**What it does:** When the user submits a prompt that looks like a multi-step or multi-agent task, this hook injects a system reminder telling Claude to **inventory available skills, plugins, slash commands, and MCP tools BEFORE dispatching agents or hand-coding**. The goal is to short-circuit reaching for raw code when a skill or MCP can do the job better.

**Trigger heuristics (any one fires):**

- Prompt contains any of: `deploy agents`, `dispatch agents`, `multi-agent`, `parallel agents`, `research`, `build`, `ship`, `create`, `implement`, `scaffold`, `design`, `generate`, `orchestrate`
- Prompt is over 50 words AND mentions a deliverable noun: `feature`, `endpoint`, `component`, `page`, `pipeline`, `workflow`, `system`, `service`, `plan`, `report`, `dashboard`, `site`, `app`, `hook`, `skill`

**Bypass:** Include the literal string `(skip toolkit audit)` anywhere in your prompt. The hook silently exits and no reminder is injected.

**Performance:** Pure stdin/stdout Python with no external deps. Runs in well under 100ms. Fail-open: any JSON parse error → exit 0 (cannot block prompt).

**Why this exists (origin story):** During brand-design iterations on 2026-04-26, the assistant repeatedly reached for hand-coded SVG instead of researching available image-extraction tooling (Hugging Face MCP, Figma MCP, sips, etc.). The user noted this pattern and made "research available toolkit before dispatching agents" the explicit standard for all devops and design tasks on this project.

## Related local hooks (per-user, hookify-managed)

The `.claude/hookify.*.local.md` files are managed by the [hookify plugin](https://docs.claude.com/en/docs/claude-code/plugins) and are **per-user** (gitignored via `.gitignore` rule `.claude/*.local.md`). They cover:

- `env-commit-block.local.md` — block commits that include `.env`
- `firebase-json-security-headers.local.md` — enforce headers in firebase.json
- `firebase-key-in-code.local.md` — block hardcoded Firebase keys
- `require-tests-before-stop.local.md` — require tests pass before /stop
- `server-dev-script.local.md` — enforce server start script convention
- `supabase-password-in-code.local.md` — block hardcoded Supabase passwords

To enable/disable hookify rules, run `/hookify:configure`.

## Adding a new team-shared hook

1. Write the hook script in `.claude/hooks/<name>.{py,sh}` and `chmod +x` it
2. Add an entry to `.claude/settings.json` under `hooks.<EventName>[].hooks[]`
3. Document it here
4. Commit both files

Hook events available: `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `Stop`, `SubagentStop`, `PreCompact`, `Notification`.
