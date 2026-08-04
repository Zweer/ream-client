# @zweer/ream-client

TypeScript client for [Ream](https://reamstories.com)'s internal API. Publish, manage, and automate stories programmatically.

> ⚠️ **Unofficial** — This library reverse-engineers Ream's internal endpoints. It may break if Ream changes their API.

## Installation

```bash
npm install @zweer/ream-client
```

## Quick Start

```typescript
import { ReamClient } from '@zweer/ream-client';

const client = new ReamClient({
  email: 'your@email.com',
  password: 'your-password',
});

// List your stories
const stories = await client.listStories();
console.log(stories);

// Create a new story
const storyKey = await client.createStory({
  Title: 'My New Story',
  Genre: [{ Type: 'primary', Name: 'Fantasy', GenreKey: 16 }],
  SubGenre: [],
  Tags: [],
  TriggerWarnings: [],
  Audience: 0,
  RomancePairings: null,
  DiversityDesignations: null,
  CoverData: 'data:image/jpeg;base64,...',
  SmallCover: 'data:image/jpeg;base64,...',
  IsMature: false,
  GAIUsed: false,
  HasPublishingRights: true,
  BookBlurb: '<p>Your book blurb here.</p>',
  Description: '<p>Short tagline</p>',
  LanguageKey: 'EN',
  MediaType: 'ebook',
});
```

## Features

| Module | Operations |
|--------|-----------|
| **Auth** | Login (email/password), session management, device fingerprint |
| **Stories** | Create, read, update, delete + reference data (genres, languages, warnings) |
| **Chapters** | Add, rename, save content (HTML paragraphs), delete |
| **Media** | Upload images to Azure Blob Storage (3-step flow) |
| **Publishing** | Publish/unpublish chapters to tiers, queue, schedule |
| **Posts** | Create, read, update, delete community posts |
| **Pages** | List pages, tiers, member totals |

## API

### `ReamClient`

The main facade class. Handles lazy authentication automatically.

```typescript
const client = new ReamClient({
  email: string;        // Ream account email
  password: string;     // Ream account password
  baseUrl?: string;     // Default: 'https://reamstories.com'
  timezone?: string;    // Default: 'Europe/Rome'
});
```

### Stories

```typescript
await client.listStories();
await client.getStory(storyKey);
await client.createStory(input);
await client.updateStory(input);
await client.deleteStory(storyKey);

// Reference data
await client.listGenres();
await client.listLanguages();
await client.listTriggerWarnings();
```

### Chapters

```typescript
await client.listChapters(storyKey);
await client.getChapter(chapterKey);
await client.addChapter({ StoryKey, DraftTitle, ChapterOrder });
await client.updateChapterTitle(chapterKey, 'New Title');
await client.saveContent({
  Paragraphs: [
    { Text: '<p>Paragraph content</p>', ParagraphOrder: 0, ChapterKey },
  ],
  ImageKeys: [],
  StoryKey,
});
await client.deleteChapter(chapterKey, storyKey);
```

### Publishing

```typescript
// Publish chapters to tiers
await client.publishAll({
  PublishDate: new Date().toISOString(),
  PublishObject: [{ ChapterKey: '...', Tiers: [tier] }],
  PageKey: '...',
  StoryKey: '...',
  MediaType: 'ebook',
});

// Check published state
await client.listPublished(storyKey, pageKey, 'ebook');

// Unpublish
await client.unpublishChapter(publishRecordKey);

// Scheduling
await client.queueAll(pageKey, storyKey, 'ebook');
await client.createSchedule({ ... });
await client.listSchedules(storyKey, pageKey, 'ebook');
await client.deleteSchedule(groupKey, pageKey, storyKey, 'ebook');
```

### Media

```typescript
// Upload an image to a chapter
const elementKey = await client.uploadImage(
  storyKey,
  chapterKey,
  imageBytes, // Uint8Array
  'image/png',
);

// Reference in chapter content:
// <p><img data-imgkey="elementKey"></p>
```

### Posts

```typescript
await client.listPosts(pageKey);
await client.getPost(postKey);
await client.createPost({ PageKey, PostTitle, Content, ... });
await client.updatePost({ PostKey, Content, PostTitle, ... });
await client.deletePost(postKey, pageKey);
```

### Pages & Tiers

```typescript
await client.listPages();
await client.getPage(pageKey);
await client.listTiers(pageKey);
await client.getMemberTotals(pageKey);
```

## Low-Level Usage

You can use the domain modules directly for more control:

```typescript
import { HttpClient, login, listStories } from '@zweer/ream-client';

const http = new HttpClient({ baseUrl: 'https://reamstories.com' });
await login(http, 'email', 'password');

const stories = await listStories(http, 'userKey');
```

## Architecture

```
lib/
├── client.ts     # ReamClient facade (recommended entry point)
├── http.ts       # Internal HTTP client (auth, retry, error mapping)
├── auth.ts       # Login flow
├── stories.ts    # Story CRUD + reference data
├── chapters.ts   # Chapter CRUD + content
├── media.ts      # Image upload (Azure Blob)
├── publish.ts    # Publish/unpublish/queue/schedule
├── posts.ts      # Community posts
├── pages.ts      # Pages + tiers
├── errors.ts     # Typed error classes
└── types.ts      # All TypeScript interfaces
```

## Development

```bash
npm install          # Install dependencies
npm run build        # Build with tsdown
npm run lint         # Run all linters
npm test             # Run unit tests
npm run test:e2e     # Run e2e tests (requires .env credentials)
```

## License

MIT
