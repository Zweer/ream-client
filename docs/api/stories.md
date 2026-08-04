# Stories

## Overview

Stories are the core content entity in Ream. Each story has metadata (title, genre, tags, cover), content (chapters), and can be of type `ebook`, `audio`, or `comic`.

All Story API endpoints are on **port 5002**: `https://reamstories.com:5002`

## Endpoints

### List User's Stories

**Endpoint:** `POST https://reamstories.com:5002/api/story/user/list`

**Request Body:**
```json
{
  "UserKey": "<user-key>"
}
```

**Response:** `200 OK`
```json
{
  "Stories": [
    {
      "UserKey": "mmwj4ghge2bdc8",
      "Title": "My Story",
      "Description": "<p>...</p>",
      "LastUpdated": "2026-08-04T11:04:59.000Z",
      "StoryKey": "msejx4002344c2",
      "Tags": [],
      "Categories": null,
      "TriggerWarnings": [],
      "Audience": 0,
      "IsMature": 0,
      "BookBlurb": "<p>...</p>",
      "DateFirstPublished": null,
      "ShowInSearch": 0,
      "MediaTypes": ["ebook"],
      "LanguageKey": "EN",
      "GAIUsed": 0,
      "Genres": [{"Name": "Fantasy", "Type": "primary", "GenreKey": 16}],
      "Completed": false,
      "SubGenres": []
    }
  ],
  "Message": "Success."
}
```

**Notes:**
- Returns all stories for the given user (drafts + published)
- `DateFirstPublished: null` indicates an unpublished draft
- `ShowInSearch: 0` means the story is not discoverable

### Get Story Details

**Endpoint:** `POST https://reamstories.com:5002/api/story/details/get`

**Request Body:**
```json
{
  "StoryKey": "<story-key>"
}
```

**Response:** `200 OK`
```json
{
  "Story": {
    "UserKey": "mmwj4ghge2bdc8",
    "Title": "My Story",
    "Description": "<p>...</p>",
    "LastUpdated": "2026-08-04T11:04:59.000Z",
    "StoryKey": "msejx4002344c2",
    "Tags": [],
    "Categories": null,
    "TriggerWarnings": [],
    "Audience": 0,
    "DiversityDesignations": null,
    "RomancePairings": null,
    "IsMature": 0,
    "BookBlurb": "<p>...</p>",
    "DateFirstPublished": null,
    "DateFirstPublishedAudio": null,
    "DateFirstPublishedComic": null,
    "ShowInSearch": 0,
    "MediaTypes": ["ebook"],
    "LanguageKey": "EN",
    "GAIUsed": 0,
    "Genres": [{"Name": "Fantasy", "Type": "primary", "GenreKey": 16}],
    "Completed": false,
    "SubGenres": []
  },
  "Message": "Success."
}
```

**Error Response:** `404 Not Found`
```json
{
  "Message": "Could not find that story."
}
```

### Create Story

**Endpoint:** `POST https://reamstories.com:5002/api/story/details/create`

**Request Body:**
```json
{
  "Title": "My Story Title",
  "Genre": [{"Type": "primary", "Name": "Fantasy", "GenreKey": 16}],
  "SubGenre": [],
  "Tags": [],
  "TriggerWarnings": [],
  "Audience": 0,
  "RomancePairings": null,
  "DiversityDesignations": null,
  "CoverData": "data:image/jpeg;base64,...",
  "SmallCover": "data:image/jpeg;base64,...",
  "IsMature": false,
  "GAIUsed": false,
  "HasPublishingRights": true,
  "BookBlurb": "<p><br></p>",
  "Description": "<p><br></p>",
  "LanguageKey": "EN",
  "MediaType": "ebook"
}
```

**Response:** `200 OK`
```json
{
  "StoryKey": "msejx4002344c2",
  "Message": "Story Created."
}
```

**Notes:**
- `CoverData` is a base64-encoded JPEG data URI (required)
- `SmallCover` is a smaller version of the same cover (also base64 data URI)
- Cover is **required** — the API will reject creation without it
- `MediaType` can be: `"ebook"`, `"audio"`, or `"comic"`
- `Audience` values: `0` = Adult, values for other audiences TBD
- `Genre` array: each entry has `Type` ("primary" or TODO: secondary?), `Name`, and `GenreKey`
- `Description` is the "Tag Line" (max 100 chars)
- `BookBlurb` is the longer description (max 2800 chars)
- Both support rich text HTML (bold, italic, underline, lists, links)

### Delete Story

**Endpoint:** `POST https://reamstories.com:5002/api/story/delete`

**Request Body:**
```json
{
  "StoryKey": "<story-key>"
}
```

**Response:** `200 OK`
```json
{
  "Message": "Story Deleted."
}
```

**Notes:**
- Permanent deletion (no soft-delete/trash)
- After deletion, `GET /api/story/details/get` returns 404

### Update Story Details

**Endpoint:** `POST https://reamstories.com:5002/api/story/details/update`

TODO: Document by editing a story via the UI

## Reference Data Endpoints

### List Genres (Categories)

**Endpoint:** `GET https://reamstories.com:5002/api/story/categories`

**Response:** `200 OK`
```json
{
  "Categories": [
    {"CategoryKey": 46, "Name": "Academia"},
    {"CategoryKey": 1, "Name": "Action"},
    {"CategoryKey": 2, "Name": "Adventure"},
    {"CategoryKey": 5, "Name": "Comedy"},
    {"CategoryKey": 12, "Name": "Drama"},
    {"CategoryKey": 14, "Name": "Erotica"},
    {"CategoryKey": 16, "Name": "Fantasy"},
    {"CategoryKey": 51, "Name": "Historical"},
    {"CategoryKey": 20, "Name": "Horror"},
    {"CategoryKey": 22, "Name": "Literary"},
    {"CategoryKey": 23, "Name": "LitRPG"},
    {"CategoryKey": 27, "Name": "Mystery"},
    {"CategoryKey": 39, "Name": "Nonfiction"},
    {"CategoryKey": 30, "Name": "Poetry"},
    {"CategoryKey": 31, "Name": "Romance"},
    {"CategoryKey": 33, "Name": "Science Fiction"},
    {"CategoryKey": 50, "Name": "Superhero"},
    {"CategoryKey": 36, "Name": "Suspense"},
    {"CategoryKey": 37, "Name": "Thriller"},
    {"CategoryKey": 49, "Name": "Western"}
  ],
  "Message": "Success."
}
```

**Notes:**
- In the creation form, these are called "Genres" — the API calls them "Categories"
- `CategoryKey` = `GenreKey` when used in story creation
- Max 4 genres per story, one must be `"primary"`

### List Sub-Genres

**Endpoint:** `POST https://reamstories.com:5002/api/story/subgenre/get`

**Request Body:**
```json
{
  "GenreKey": 16
}
```

**Response:** `200 OK`

TODO: Document response (returns sub-genres for a given genre)

### List Languages

**Endpoint:** `GET https://reamstories.com:5002/api/story/languages`

**Response:** `200 OK`
```json
[
  {"LanguagesKey": "BGL", "Name": "Bengali"},
  {"LanguagesKey": "CHS", "Name": "Chinese"},
  {"LanguagesKey": "EN", "Name": "English"},
  {"LanguagesKey": "FRN", "Name": "French"},
  {"LanguagesKey": "FRS", "Name": "Farsi"},
  {"LanguagesKey": "GMN", "Name": "German"},
  {"LanguagesKey": "GRK", "Name": "Greek"},
  {"LanguagesKey": "HND", "Name": "Hindi"},
  {"LanguagesKey": "ITL", "Name": "Italian"},
  {"LanguagesKey": "JPN", "Name": "Japanese"},
  {"LanguagesKey": "KRN", "Name": "Korean"},
  {"LanguagesKey": "PLS", "Name": "Polish"},
  {"LanguagesKey": "PTB", "Name": "Portuguese"},
  {"LanguagesKey": "SPN", "Name": "Spanish"},
  {"LanguagesKey": "SWD", "Name": "Swedish"},
  {"LanguagesKey": "TRK", "Name": "Turkish"},
  {"LanguagesKey": "UKR", "Name": "Ukrainian"}
]
```

### List Trigger Warnings (Content Warnings)

**Endpoint:** `GET https://reamstories.com:5002/api/story/trigger-warnings`

**Response:** `200 OK`
```json
{
  "TriggerWarnings": [
    {"TriggerWarningKey": 2, "Name": "Abortion"},
    {"TriggerWarningKey": 70, "Name": "Adult Language"},
    {"TriggerWarningKey": 3, "Name": "Amputation"},
    ...
  ],
  "Message": "Success."
}
```

**Notes:**
- Full list has ~70 entries
- Used in story creation `TriggerWarnings` array

### List Series

**Endpoint:** `POST https://reamstories.com:5002/api/story/series/get`

**Request Body:**
```json
{
  "UserKey": "<user-key>"
}
```

**Response:** `200 OK`

TODO: Document response structure

## Become an Author

**Endpoint:** `POST https://reamstories.com:5001/api/user/author/set`

**Request Body:**
```json
{}
```

**Response:** `200 OK`
```json
{
  "IsAuthor": true,
  "Message": "Success!"
}
```

**Notes:**
- Converts a reader account to an author account
- Requires email verification before accessing author dashboard
- After calling this, `IsAuthor` in login response changes from `0` to `1`
- This is a one-way operation (no "unset" endpoint observed)

## API Ports

| Port | Purpose |
|------|---------|
| 5001 | User API (author/set is here) |
| 5002 | Story API (all story CRUD) |
| 5003 | Page API (author page management) |
