# Chapters

## Overview

Chapters are the content units within a Story. Each chapter has a title, an ordered list of paragraphs (HTML content), and metadata about its publish state.

All Chapter API endpoints are on **port 5002**: `https://reamstories.com:5002`

## Endpoints

### List Chapters

**Endpoint:** `POST https://reamstories.com:5002/api/story/chapter/list`

**Request Body:**
```json
{
  "StoryKey": "<story-key>"
}
```

**Response:** `200 OK`
```json
{
  "Chapters": [
    {
      "ChapterKey": "msek7pghd4ee4a0",
      "Title": "Chapter 1",
      "DraftTitle": "Chapter 1",
      "ChapterOrder": 0
    }
  ],
  "Message": "Success."
}
```

**Notes:**
- `ChapterOrder` is 0-based
- `Title` is the published title; `DraftTitle` is the working title
- Returns empty array `[]` if no chapters exist

### Get Chapter (with content)

**Endpoint:** `POST https://reamstories.com:5002/api/story/chapter/get`

**Request Body:**
```json
{
  "ChapterKey": "<chapter-key>"
}
```

**Response:** `200 OK`
```json
{
  "Chapter": {
    "ChapterKey": "msek7pghd4ee4a0",
    "StoryKey": "msek72jsdd2f8c",
    "Title": "Chapter 1",
    "DraftTitle": "Chapter 1",
    "ChapterOrder": 0,
    "IsPublished": 0,
    "RawEBookData": 0,
    "SalesIncluded": 1,
    "Paragraphs": [
      {
        "ParagraphKey": "msek8yis42e772",
        "ChapterKey": "msek7pghd4ee4a0",
        "ParagraphOrder": 0,
        "Text": "<p data-pkey=\"msek8yis42e772\">Content here...</p>",
        "Comments": 0
      }
    ]
  },
  "Message": "Success."
}
```

**Notes:**
- `IsPublished`: `0` = draft, `1` = published
- `SalesIncluded`: `1` = included in single-sale purchase
- `Paragraphs` contains the actual chapter content as HTML
- Each paragraph `Text` wraps content in `<p data-pkey="...">...</p>`
- `Comments` indicates number of inline comments on that paragraph

### Add Chapter

**Endpoint:** `POST https://reamstories.com:5002/api/story/chapter/add`

**Request Body:**
```json
{
  "ChapterOrder": 0,
  "StoryKey": "<story-key>",
  "DraftTitle": "Chapter 1"
}
```

**Response:** `200 OK`
```json
{
  "ChapterKey": "msek7pghd4ee4a0",
  "Message": "Chapter Created."
}
```

**Notes:**
- `ChapterOrder` determines position (0-based)
- `DraftTitle` is the initial chapter title
- The chapter is created empty (no paragraphs)

### Update Chapter Title

**Endpoint:** `POST https://reamstories.com:5002/api/story/chapter/update/title`

**Request Body:**
```json
{
  "ChapterKey": "<chapter-key>",
  "Title": "New Title"
}
```

**Response:** `200 OK`
```json
{
  "Message": "Success."
}
```

### Save Chapter Content (Paragraphs)

**Endpoint:** `POST https://reamstories.com:5002/api/story/chapter/paragraphs/add`

**Request Body:**
```json
{
  "Paragraphs": [
    {
      "Text": "<p>First paragraph content.</p>",
      "ParagraphOrder": 0,
      "ChapterKey": "<chapter-key>"
    },
    {
      "Text": "<p>Second paragraph content.</p>",
      "ParagraphOrder": 1,
      "ChapterKey": "<chapter-key>"
    }
  ],
  "ImageKeys": [],
  "StoryKey": "<story-key>"
}
```

**Response:** `200 OK`
```json
{
  "Message": "Success."
}
```

**Notes:**
- This is a **full replace** — all paragraphs for the chapter are sent each time
- `Text` is HTML (supports `<p>`, `<strong>`, `<em>`, `<u>`, `<ol>`, `<ul>`, `<li>`, `<a>`, inline images)
- `ParagraphOrder` is 0-based
- `ImageKeys` contains keys of any images embedded in the chapter content
- Quill.js editor is used on the frontend

### Delete Chapter

**Endpoint:** `POST https://reamstories.com:5002/api/story/chapter/delete`

**Request Body:**
```json
{
  "ChapterKey": "<chapter-key>",
  "StoryKey": "<story-key>"
}
```

**Response:** `200 OK`
```json
{
  "Message": "Chapter Deleted."
}
```

## Chapter Lifecycle

1. **Create** → `chapter/add` (creates empty chapter with title)
2. **Write** → `chapter/paragraphs/add` (saves content)
3. **Rename** → `chapter/update/title` (updates title)
4. **Publish** → See `docs/api/publish.md`
5. **Delete** → `chapter/delete` (permanent)
