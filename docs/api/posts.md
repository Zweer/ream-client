# Community Posts

## Overview

Community posts are updates that authors share with their members/followers. Posts have a title, rich-text content, tier-based visibility, and can optionally include polls or be scheduled for later.

All Post API endpoints are on **port 5003**: `https://reamstories.com:5003`

## Endpoints

### List Posts

**Endpoint:** `POST https://reamstories.com:5003/api/page/post/list`

**Request Body:**
```json
{
  "PageKey": "<page-key>"
}
```

**Response:** `200 OK`
```json
{
  "Posts": [
    {
      "PostKey": "msen941f1089bc",
      "PageKey": "msejmbmp09b640",
      "UserKey": "mmwj4ghge2bdc8",
      "CreatedDate": "2026-08-04T12:38:13.000Z",
      "LastEdit": null,
      "Content": "<p>Post content here...</p>",
      "Comments": 0,
      "TierKeys": "msejmbmp09f1fe11",
      "RelatedTo": null,
      "PostTitle": "My Post Title",
      "IsScheduled": 0,
      "ReleaseDate": null,
      "Pinned": 0,
      "TimeZone": "Europe/Rome",
      "PageName": null,
      "HasPoll": 0,
      "TierNames": ["Followers"],
      "HasAccess": true
    }
  ],
  "Message": "Post Found."
}
```

**Empty Response:**
```json
{
  "Posts": [],
  "Message": "No Posts Found."
}
```

**Notes:**
- `TierKeys` is a comma-separated string of tier keys (not an array)
- `TierNames` is an array of human-readable tier names
- `IsScheduled`: `0` = published immediately, `1` = scheduled
- `Pinned`: `0` = not pinned, `1` = pinned to top
- `HasPoll`: `0` = no poll, `1` = has poll attached
- `HasAccess`: whether the current user can view this post

### List Pinned Posts

**Endpoint:** `POST https://reamstories.com:5003/api/page/post/pin/list`

**Request Body:**
```json
{
  "PageKey": "<page-key>"
}
```

**Response:** Same structure as `post/list`, filtered to pinned posts only.

### Get Single Post

**Endpoint:** `POST https://reamstories.com:5003/api/page/post/get`

**Request Body:**
```json
{
  "PostKey": "<post-key>"
}
```

**Response:** `200 OK`
```json
{
  "Post": { ... },
  "HasAccess": true,
  "Message": "Post Found."
}
```

**Not Found / Deleted:**
```json
{
  "Post": null,
  "HasAccess": false,
  "Message": "No Posts Found."
}
```

### Create Post

**Endpoint:** `POST https://reamstories.com:5003/api/page/post/add`

**Request Body:**
```json
{
  "PageKey": "<page-key>",
  "PostTitle": "My Post Title",
  "Content": "<p>Rich text content here.</p>",
  "UserKey": "<user-key>",
  "TierKeys": "<tier-key>",
  "RelatedTo": null,
  "ReleaseDate": null,
  "IsScheduled": false,
  "TimeZone": "Europe/Rome",
  "CreatedDate": "2026-08-04 12:38:13"
}
```

**Response:** `200 OK`

TODO: Document exact response body (likely returns PostKey)

**Notes:**
- `Content` is rich-text HTML (same editor as chapters — Quill.js)
- `TierKeys` is a string — single tier key or comma-separated for multiple
- `RelatedTo` links the post to a story or topic (null if none)
- `ReleaseDate` is set when scheduling (`IsScheduled: true`)
- `CreatedDate` is sent by the client in `YYYY-MM-DD HH:mm:ss` format
- `TimeZone` is the user's timezone string

### Delete Post

**Endpoint:** `POST https://reamstories.com:5003/api/page/post/delete`

**Request Body:**
```json
{
  "PostKey": "<post-key>",
  "PageKey": "<page-key>"
}
```

**Response:** `200 OK`
```json
{
  "Message": "Post Deleted."
}
```

### Update Post

**Endpoint:** `POST https://reamstories.com:5003/api/page/post/update`

TODO: Document by editing a post via the UI

## Post Lifecycle

1. **Create** → `post/add` (immediately published or scheduled)
2. **List** → `post/list` (all posts for a page)
3. **Read** → `post/get` (single post)
4. **Delete** → `post/delete` (permanent)
5. **Pin** → `post/pin/list` (list pinned), endpoint for pinning TBD

## Scheduling

Set `IsScheduled: true` and provide a `ReleaseDate` to schedule a post for future publication. The `TimeZone` field ensures correct local time interpretation.
