# Publishing

## Overview

Publishing in Ream is chapter-based. Each chapter can be published to one or more "tiers" (access levels). Stories are serialized — chapters are released individually, not the whole book at once.

All Publishing API endpoints are on **port 5002**: `https://reamstories.com:5002`

## Concepts

### Tiers

Tiers control who can read a chapter. Default tiers for a new page:

| Tier | Level | Cost | Description |
|------|-------|------|-------------|
| Followers | 0 | Free | Users who follow the author |
| Public | - | Free | Anyone (TODO: confirm IsPublic flag) |

Paid tiers (memberships) can be configured via the Page settings.

### Page

Every author has at least one "Page" (identified by `PageKey`). Publishing always requires a `PageKey` to associate the chapters with the correct author page.

## Endpoints

### List Published Chapters

**Endpoint:** `POST https://reamstories.com:5002/api/story/publish/list`

**Request Body:**
```json
{
  "StoryKey": "<story-key>",
  "PageKey": "<page-key>",
  "MediaType": "ebook"
}
```

**Response:** `200 OK`
```json
[
  {
    "PublishRecordKey": 2481972,
    "TierKey": "msejmbmp09f1fe11",
    "PageKey": "msejmbmp09b640",
    "ChapterKey": "msek7pghd4ee4a0",
    "StoryKey": "msek72jsdd2f8c",
    "PublishDate": "2026-08-04T11:16:27.000Z",
    "IsPublic": 0,
    "StripeProductId": null,
    "MediaType": "ebook"
  }
]
```

**Notes:**
- Returns an array (not wrapped in object)
- One entry per chapter-tier combination
- `IsPublic`: `0` = not public, `1` = public
- `PublishDate` is when the chapter was published

### Publish All Chapters

**Endpoint:** `POST https://reamstories.com:5002/api/story/publish/all`

**Request Body:**
```json
{
  "PublishDate": "2026-08-04T13:16:22.882+02:00",
  "PublishObject": [
    {
      "ChapterKey": "<chapter-key>",
      "Tiers": [
        {
          "TierKey": "msejmbmp09f1fe11",
          "PageKey": "msejmbmp09b640",
          "Name": "Followers",
          "Level": "0",
          "DescHidden": 0,
          "Description": "",
          "Cost": 0,
          "CostType": "usd",
          "Frequency": "never",
          "IsArchived": 0,
          "MemberLimit": null,
          "MembersNumber": 0,
          "Color": null,
          "CreatedDate": "2026-08-04T10:56:36.000Z",
          "StripeLinkId": null,
          "StripeLinkUrl": null,
          "StripePriceItemId": null,
          "StripeProductId": null,
          "StripeAccountId": null,
          "IsPublicTier": 0,
          "IsFollowingTier": 1,
          "IncludesPhysicalGoods": 0,
          "CustomWelcomeMessage": null,
          "NoShipSetting": null,
          "ImageUrl": ""
        }
      ]
    }
  ],
  "PageKey": "<page-key>",
  "StoryKey": "<story-key>",
  "MediaType": "ebook"
}
```

**Response:** `200 OK`
```json
{
  "Message": "Success."
}
```

**Notes:**
- `PublishDate` is an ISO 8601 date with timezone offset
- `PublishObject` is an array — one entry per chapter to publish
- Each chapter specifies which `Tiers` it should be published to
- The full Tier object is sent (as received from the page/tiers API)
- `IsFollowingTier: 1` = the free "Followers" tier
- `IsPublicTier: 1` = available to anyone without following
- Setting a future `PublishDate` schedules the chapter for later release

### Unpublish Chapter

**Endpoint:** `POST https://reamstories.com:5002/api/story/publish/delete`

**Request Body:**
```json
{
  "PublishRecordKey": 2482212
}
```

**Response:** `200 OK`
```json
{
  "Message": "Chapter Unpublished."
}
```

**Notes:**
- `PublishRecordKey` is obtained from the `publish/list` response
- Removes a single chapter-tier publish record
- To fully unpublish a chapter from all tiers, call once per `PublishRecordKey`

## Tier Properties

| Field | Description |
|-------|-------------|
| `TierKey` | Unique tier identifier |
| `PageKey` | Page this tier belongs to |
| `Name` | Display name (e.g., "Followers") |
| `Level` | Tier level (0 = free, higher = premium) |
| `Cost` | Price in `CostType` currency |
| `CostType` | Currency code (e.g., "usd") |
| `Frequency` | Billing frequency ("never", "monthly", "yearly") |
| `IsFollowingTier` | `1` if this is the default followers tier |
| `IsPublicTier` | `1` if this tier is publicly visible |
| `IsArchived` | `1` if tier is no longer active |

## Publishing Flow

1. **Create story** → `story/details/create`
2. **Add chapters** → `chapter/add`
3. **Write content** → `chapter/paragraphs/add`
4. **Publish** → `story/publish/all` (immediate or scheduled)
5. **Check status** → `story/publish/list`
