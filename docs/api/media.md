# Media (Image Upload)

## Overview

Ream uses **Azure Blob Storage** for image/media hosting. The upload flow is a 3-step process:

1. **Get SAS Token** — request a time-limited upload token from Ream's API
2. **Register Element** — tell Ream about the file you're uploading (size tracking)
3. **Upload to Azure** — PUT the raw file bytes directly to Azure Blob Storage

All Media API endpoints are on **port 5002**: `https://reamstories.com:5002`

## Upload Flow

### Step 1: Get Upload Token (SAS)

**Endpoint:** `POST https://reamstories.com:5002/api/story/ebook/token/get`

**Request Body:**
```json
{
  "StoryKey": "<story-key>",
  "ChapterKey": "<chapter-key>",
  "ElementKey": "<element-key>",
  "PermissionRequested": "owner"
}
```

**Response:** `200 OK`
```json
{
  "Token": "sv=2024-05-04&st=2026-08-04T12%3A39%3A51Z&se=2026-08-04T13%3A44%3A51Z&sr=c&sp=rcwd&sig=VYIkz4D5OlFl826yceQa1Mw5tDgKKb5KeRyEGx199LE%3D",
  "Expiration": "2026-08-04T13:44:51.992Z",
  "Message": "Success",
  "AUTHOR_USER_KEY": "mmwj4ghge2bdc8",
  "HAS_ACCESS": true
}
```

**Notes:**
- `Token` is an Azure SAS (Shared Access Signature) query string
- Token is valid for ~1 hour (`Expiration`)
- `ElementKey` is a client-generated unique ID for the image
- `PermissionRequested: "owner"` grants read/create/write/delete permissions (`sp=rcwd`)

### Step 2: Register Element

**Endpoint:** `POST https://reamstories.com:5002/api/story/ebook/element/create`

**Request Body:**
```json
{
  "StoryKey": "<story-key>",
  "ChapterKey": "<chapter-key>",
  "ElementKey": "<element-key>",
  "Bytes": 339
}
```

**Response:** `200 OK`
```json
{
  "ElementKey": "<element-key>",
  "Message": "Element Data Stored."
}
```

**Notes:**
- `Bytes` is the file size in bytes
- This registers the element metadata in Ream's database

### Step 3: Upload to Azure Blob Storage

**Endpoint:** `PUT https://reamebook.blob.core.windows.net/<story-key>/<element-key>?<sas-token>`

**Request Headers:**
```
Content-Type: application/octet-stream
x-ms-blob-type: BlockBlob
x-ms-blob-content-type: image/png
x-ms-version: 2024-05-04
```

**Request Body:** Raw binary file data

**Response:** `201 Created`

**Notes:**
- The URL pattern is: `https://reamebook.blob.core.windows.net/{StoryKey}/{ElementKey}?{Token}`
- `x-ms-blob-content-type` should match the actual file MIME type
- Uses Azure Storage SDK (`azsdk-js-azure-storage-blob/12.23.0`)
- After upload, the image URL for reading is: `https://reamebook.blob.core.windows.net/{StoryKey}/{ElementKey}?{Token}`

## Referencing Images in Content

After uploading, images are referenced in chapter paragraphs:

```html
<p><img data-imgkey="msengefp4w"></p>
```

And the `ImageKeys` array in `chapter/paragraphs/add` must include the key:

```json
{
  "Paragraphs": [
    {
      "Text": "<p><img data-imgkey=\"msengefp4w\"></p>",
      "ParagraphOrder": 0,
      "ChapterKey": "<chapter-key>"
    }
  ],
  "ImageKeys": ["msengefp4w"],
  "StoryKey": "<story-key>"
}
```

## Storage Structure

| Component | Value |
|-----------|-------|
| Storage Account | `reamebook` |
| Container | `{StoryKey}` (one container per story) |
| Blob Name | `{ElementKey}` (unique per image) |
| Base URL | `https://reamebook.blob.core.windows.net` |

## Cover Images

Story cover images are **NOT** uploaded via Azure Blob Storage. They are sent inline as base64 data URIs in the `story/details/create` request body (`CoverData` and `SmallCover` fields).
