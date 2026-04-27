#!/usr/bin/env python3
"""
UserPromptSubmit hook: toolkit-audit reminder.

Fires when the user's prompt looks like a multi-step / multi-agent task. Injects
a system reminder telling Claude to inventory available skills, plugins, slash
commands, and MCP tools BEFORE dispatching agents — pick the highest-leverage
tool first.

Bypass: include the literal string "(skip toolkit audit)" anywhere in the prompt.
"""
import json
import re
import sys

TRIGGER_KEYWORDS = (
    "deploy agents", "dispatch agents", "multi-agent", "parallel agents",
    "research", "build", "ship", "create", "implement", "scaffold",
    "design", "generate", "orchestrate",
)

DELIVERABLE_NOUNS = (
    "feature", "endpoint", "component", "page", "pipeline", "workflow",
    "system", "service", "plan", "report", "dashboard", "site", "app",
    "hook", "skill",
)

REMINDER = (
    "Toolkit audit (auto-injected): before dispatching agents or hand-coding, "
    "take 30 seconds to inventory available tools. Check ~/.claude/skills/ and "
    "~/.claude/plugins/ for relevant skills, list MCP servers in .mcp.json + "
    "~/.claude.json, scan available slash commands, and run `which <tool>` for "
    "any CLI you might need. Pick the highest-leverage tool first — don't "
    "reach for raw code when a skill or MCP can short-circuit the work. "
    "Bypass: include \"(skip toolkit audit)\" in your prompt."
)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        sys.exit(0)

    low = prompt.lower()
    if "(skip toolkit audit)" in low:
        sys.exit(0)

    triggered = any(kw in low for kw in TRIGGER_KEYWORDS)

    if not triggered:
        words = len(re.findall(r"\S+", prompt))
        if words > 50 and any(noun in low for noun in DELIVERABLE_NOUNS):
            triggered = True

    if not triggered:
        sys.exit(0)

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": REMINDER,
        }
    }))


if __name__ == "__main__":
    main()
