# AGENTS.md — ream-client

Universal steering file for AI agents working on this project.

## Project Identity

**ream-client** is a TypeScript library that wraps Ream's internal API for publishing, managing, and automating stories programmatically. No official Ream API exists — this library reverse-engineers the internal endpoints via Playwright-based discovery.

The library covers: authentication (email/password login), posts CRUD, publish/unpublish/schedule, sections/categories, drafts management, and subscriber/membership operations.

## Stack

- **Language:** TypeScript (strict mode, ES modules)
- **Runtime:** Node.js 22+
- **HTTP:** Native fetch (async/await)
- **Testing:** Vitest
- **Build:** tsdown
- **Lint/Format:** Biome
- **Package:** `@zweer/ream-client` (npm)

## Documentation Structure

```
docs/
├── api/               # Reverse-engineered API reference (produced by rev-eng agent)
├── conventions/       # Code style, tooling, testing, commit rules
├── workflows/         # Cognitive modes (plan-product, plan-eng, code-review, ship-prep)
└── specs/             # Feature specs (requirements → design → tasks → testlist)
```

Follow the conventions in `docs/conventions/`. When invoking workflow modes, refer to `docs/workflows/`.

## Agent Architecture

This project uses two specialized Kiro agents (`.kiro/agents/`):

| Agent | Config | Prompt | Purpose |
|-------|--------|--------|---------|
| `rev-eng` | `.kiro/agents/rev-eng.json` | `.kiro/prompts/rev-eng.md` | Reverse engineering via Playwright MCP — discovers and documents Ream's internal API |
| `dev` | `.kiro/agents/dev.json` | `.kiro/prompts/dev.md` | Development — reads API docs and implements the TypeScript library |

### Workflow

1. **Discovery phase:** Switch to `rev-eng` agent (`/agent swap rev-eng`). It uses Playwright MCP to navigate Ream, intercept network calls, and document endpoints in `docs/api/`
2. **Implementation phase:** Switch to `dev` agent (`/agent swap dev`). It reads `docs/api/` and implements the library in `lib/`

### MCP Servers

The `rev-eng` agent has `@playwright/mcp` configured. It provides:
- Full browser automation (navigate, click, type, etc.)
- Network request interception and inspection
- DOM/accessibility tree reading
- Screenshot capture

## Conventions (Summary)

Full details in `.kiro/steering/`. Key rules:

- TypeScript strict, no `any`, explicit return types on exports
- ES modules with `.js` extensions in imports
- `async/await` everywhere, native `fetch`
- Biome for lint + format (not ESLint/Prettier)
- Vitest for tests (AAA pattern)
- Conventional commits + gitmoji (text codes, not emoji)

## Interaction Rules

### Language
- **Conversation:** Italian
- **Code, comments, commits, docs:** English

### Git
- **NEVER commit, push, or create tags** — the developer handles all git operations
- Prepare changes and suggest a commit message
- The developer reviews and commits manually

### Interview Before Implementing
For ambiguous or complex requests, ask clarifying questions BEFORE writing code. Skip for clear, well-defined tasks.

### Plan Before Implementing
For multi-step tasks (new features, refactors, architecture changes):
1. Write a short numbered plan first
2. Wait for approval before implementing
3. Adapt the plan if requirements change mid-execution

Skip planning for single-file fixes, small bug fixes, or simple questions.
