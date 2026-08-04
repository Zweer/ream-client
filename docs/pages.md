# Pages

## Overview

Every author on Ream has at least one "Page" — a public-facing profile that hosts their stories, community posts, and membership tiers. Pages are managed on **port 5003**: `https://reamstories.com:5003`

## Endpoints

### Get Page

**Endpoint:** `POST https://reamstories.com:5003/api/page/get`

**Request Body:**
```json
{
  "PageKey": "<page-key>"
}
```

**Response:** `200 OK`
```json
{
  "Page": {
    "PageKey": "msejmbmp09b640",
    "UserKey": "mmwj4ghge2bdc8",
    "Name": null,
    "CreatingSmallDesc": null,
    "Description": null,
    "VideoUrl": null,
    "IsLaunched": 0,
    "CreatedDate": "2026-08-04T10:56:36.000Z",
    "IsIncomePrivate": 1,
    "IsSubPrivate": 0,
    "IsFollowersPrivate": 0,
    "PageMoniker": null,
    "LastPayoutDate": null,
    "DisableAutoPayout": 0,
    "Paused": 0,
    "BrandColor": null
  },
  "Message": "Success."
}
```

**Notes:**
- `IsLaunched`: `0` = draft page (not visible publicly), `1` = launched
- `PageMoniker` is the URL slug (e.g., `reamstories.com/<moniker>`)
- A page is automatically created when a user becomes an author
- `Name` is null until the author fills in their page profile

### List User's Pages

**Endpoint:** `POST https://reamstories.com:5003/api/page/list`

**Request Body:**
```json
{
  "UserKey": "<user-key>"
}
```

**Response:** `200 OK`
```json
{
  "Pages": [
    {
      "PageKey": "msejmbmp09b640",
      "UserKey": "mmwj4ghge2bdc8",
      "Name": null,
      "CreatingSmallDesc": null,
      "Description": null,
      "VideoUrl": null,
      "IsLaunched": 0,
      "CreatedDate": "2026-08-04T10:56:36.000Z",
      "IsIncomePrivate": 1,
      "IsSubPrivate": 0,
      "IsFollowersPrivate": 0,
      "PageMoniker": null,
      "LastPayoutDate": null,
      "DisableAutoPayout": 0,
      "Paused": 0,
      "BrandColor": null
    }
  ],
  "Message": "Pages Found."
}
```

### List Tiers

**Endpoint:** `POST https://reamstories.com:5003/api/page/tier/list`

**Request Body:**
```json
{
  "PageKey": "<page-key>"
}
```

**Response:** `200 OK`
```json
{
  "Tiers": [
    {
      "TierKey": "msejmbmp09f1fe11",
      "PageKey": "msejmbmp09b640",
      "Name": "Followers",
      "Level": "0",
      "DescHidden": 0,
      "Description": "This tier is for giving followers access to follower content.",
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
      "ExcludedCountries": null
    },
    {
      "TierKey": "msejmbmpa8ffba00",
      "PageKey": "msejmbmp09b640",
      "Name": "Public",
      "Level": "0",
      "DescHidden": 0,
      "Description": "This tier is for giving public access to a few chapters.",
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
      "IsPublicTier": 1,
      "IsFollowingTier": 0,
      "IncludesPhysicalGoods": 0,
      "CustomWelcomeMessage": null,
      "NoShipSetting": null,
      "ExcludedCountries": null
    }
  ],
  "Message": "Success."
}
```

**Notes:**
- Default tiers "Followers" and "Public" are created automatically with the page
- `IsFollowingTier: 1` = free tier for followers
- `IsPublicTier: 1` = publicly accessible without following
- Paid tiers have `Cost > 0` and `Frequency` of "monthly" or "yearly"

### Get Member Totals

**Endpoint:** `POST https://reamstories.com:5001/api/user/member/totals`

**Request Body:**
```json
{
  "PageKey": "<page-key>"
}
```

**Response:** `200 OK`
```json
{
  "Followers": 0,
  "Members": 0,
  "Subscriptions": []
}
```

### Search Members/Subscribers

**Endpoint:** `POST https://reamstories.com:5001/api/user/stripe/subscription/search-page`

**Request Body:**
```json
{
  "PageKey": "<page-key>",
  "NumberToShowPerPage": 10,
  "PageNumber": 0,
  "NameEmail": "",
  "TierKeys": [],
  "IsFollowingTierIncluded": false,
  "Statuses": ["active"],
  "IsMuted": "Include Muted",
  "IsBanned": "Remove Banned"
}
```

**Response:** `200 OK`
```json
{
  "Members": [],
  "Total": 0
}
```

**Notes:**
- Paginated: `NumberToShowPerPage` + `PageNumber` (0-based)
- `NameEmail` for text search/filtering
- `TierKeys` array to filter by specific tiers
- `IsFollowingTierIncluded: true` to include free followers
- `Statuses`: `["active"]`, possibly also `"canceled"`, `"past_due"`
- `IsMuted` / `IsBanned`: string filter values ("Include Muted", "Remove Banned")
```

## API Ports

| Port | Purpose |
|------|---------|
| 5001 | User API (member/totals is here) |
| 5003 | Page API (page CRUD, tiers, posts) |
