# Commit Conventions

**IMPORTANT**: The agent NEVER commits, pushes, or creates tags. The developer handles all git operations manually. At the end of each task, suggest a commit message.

## Format

Conventional commits with gitmoji as text codes (not emoji):

```
type(scope): :emoji_code: short description

Detailed explanation of what changed and why.
```

## Types

- `feat` — New feature (`:sparkles:`)
- `fix` — Bug fix (`:bug:`)
- `perf` — Performance improvement (`:zap:`)
- `docs` — Documentation (`:memo:`)
- `chore` — Maintenance tasks (`:wrench:`, `:arrow_up:`, `:bookmark:`)
- `refactor` — Code refactoring (`:recycle:`)
- `test` — Tests (`:white_check_mark:`)
- `style` — Code formatting (`:art:`)
- `ci` — CI/CD changes (`:construction_worker:`)
- `build` — Build system (`:hammer:`)

## Scope

Use the module or area affected:
- `client` — Main ReamClient class
- `posts` — Post CRUD operations
- `publish` — Publish/schedule/unpublish
- `sections` — Section CRUD
- `auth` — Authentication (login/session)
- `media` — Image/media upload
- `types` — Type definitions
- `http` — HTTP client internals

Scope is optional for cross-cutting changes.

## Gitmoji

**Always use text codes** (`:sparkles:`), **never actual emoji** (✨).

## Body

**Always include a detailed body** explaining:
1. What was changed
2. Why it was changed
3. Any important context or side effects

## Examples

```
feat(auth): :sparkles: implement email/password login

Add login flow using Ream's POST /auth/login endpoint.
Store session cookie for subsequent requests.
Auto-refresh session on 401 responses.
```

```
docs(api): :memo: document posts CRUD endpoints

Reverse-engineered from Ream dashboard:
- GET /api/posts (list, pagination via cursor)
- POST /api/posts (create draft)
- PUT /api/posts/:id (update)
- DELETE /api/posts/:id (delete)
```

```
fix(http): :bug: handle rate limit with retry-after header

Ream returns 429 with Retry-After header in seconds.
Previously we used fixed backoff; now we respect the header value.
```
