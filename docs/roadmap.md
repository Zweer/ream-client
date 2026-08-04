# Roadmap

Endpoints and features discovered during reverse engineering but not yet implemented.

## Notifications

- `GET /api/user/notifications/count` — Content/social notification counts
- `GET /api/user/notifications/list` — Paginated notification list
- `POST /api/user/notifications/read` — Mark notifications as read

## Stories — Additional Features

- **Sub-genres** — The API supports sub-genres (`SubGenre` field), but we don't expose a `listSubGenres()` helper
- **Series** — Grouping stories into series (not yet discovered in the API)
- **Completed flag** — `POST /api/story/completed/set` to mark a story as complete

## Posts — Additional Features

- **Pinning/unpinning** — `POST /api/page/post/pin` / `POST /api/page/post/unpin`
- **Polls** — Creating polls within posts (`HasPoll` field exists)

## Pages — Additional Features

- **Page settings** — Update page description, brand color, moniker, etc.
- **Launch/pause page** — Toggle `IsLaunched` / `Paused` state

## Media

- **Audio upload** — Upload audio files for audiobook chapters
- **Comic panels** — Upload comic pages/panels

## Publishing

- **Bulk unpublish** — Unpublish multiple chapters at once
- **Queue reorder** — Change the order of queued chapters
