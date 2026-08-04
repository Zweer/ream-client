# Authentication

## Overview

Ream uses a stateless, token-based authentication system. There are no session cookies — instead, credentials are exchanged for an encrypted `AuthToken` which is stored in `localStorage` and sent as an `authorization` header on every subsequent request.

The API runs on a separate port from the main site:
- **User API:** `https://reamstories.com:5001`
- **Story API:** `https://reamstories.com:5002`

## Endpoints

### Login (Authenticate)

**Endpoint:** `POST https://reamstories.com:5001/api/user/authenticate`

**Request Headers:**
```
Content-Type: application/json
x-ream-device-key: <device-key>
x-ream-device-fingerprint: <base64-encoded-fingerprint>
x-ream-timezone: Europe/Rome
```

**Request Body:**
```json
{
  "Email": "user@example.com",
  "Password": "plaintext-password"
}
```

**Response:** `200 OK`
```json
{
  "AuthToken": "U2FsdGVkX1...<encrypted-token>",
  "StripeAccountId": null,
  "StripeAccountType": null,
  "StripeCustomerId": null,
  "UserKey": "mmwj4ghge2bdc8",
  "DisplayName": "Zweer",
  "SID": "msej9s0711f26b",
  "IsAuthor": 0,
  "Email": "user@example.com",
  "EmailVerified": 0,
  "NeverShowFollowAgain": 0,
  "CanSeeMature": 1,
  "Handle": "zweer",
  "Message": "Authenticated."
}
```

**Notes:**
- Password is sent in **plaintext** (no client-side hashing)
- `AuthToken` appears to be AES-encrypted (starts with `U2FsdGVkX1` = base64 of "Salted__", typical of CryptoJS AES)
- `SID` changes on every login (session ID)
- `UserKey` is a permanent user identifier
- `IsAuthor` indicates whether the user has author capabilities (0 = reader only)
- The response header `X-Ream-Device-Key` echoes back the device key
- If `x-ream-device-key` is not provided in the request, the server generates one and returns it in the response header

### Device Fingerprint

The `x-ream-device-fingerprint` header is a base64-encoded JSON object containing browser/hardware info:

```json
{
  "userAgent": "Mozilla/5.0 ...",
  "languages": ["en-US", "en"],
  "hardwareConcurrency": 8,
  "deviceMemory": 16,
  "webglVendor": "Google Inc. (Google)",
  "webglRenderer": "ANGLE (Google, Vulkan 1.3.0 ...)"
}
```

**Notes:**
- This fingerprint is generated client-side and stored in `localStorage` as `ReamDeviceFingerprint`
- It's sent on every request, not just authentication
- The `x-ream-device-key` is a shorter identifier also stored in `localStorage` as `ReamDeviceKey`

## Authenticated Request Pattern

All authenticated API calls use these headers:

```
Content-Type: application/json
authorization: <AUTH_TOKEN value>
userkey: <USER_KEY value>
sid: <SID value>
x-ream-device-key: <ReamDeviceKey value>
x-ream-device-fingerprint: <ReamDeviceFingerprint value>
x-ream-timezone: Europe/Rome
ngsw-bypass: true
accept: application/json
```

**Notes:**
- `authorization` = the `AuthToken` from login response (NOT prefixed with "Bearer")
- `userkey` = the `UserKey` from login response (lowercase header name)
- `sid` = the `SID` from login response (lowercase header name)
- `ngsw-bypass: true` = bypasses Angular service worker caching
- All values stored in `localStorage` after successful login

## localStorage Keys (Post-Login)

| Key | Description |
|-----|-------------|
| `AUTH_TOKEN` | Encrypted session token |
| `USER_KEY` | Permanent user identifier |
| `SID` | Session ID (changes per login) |
| `DISPLAY_NAME` | User's display name |
| `USER_EMAIL` | User's email |
| `USER_HANDLE` | URL-friendly username |
| `STRIPE_ACCOUNT_TYPE` | Stripe account type (if connected) |
| `CAN_SEE_MATURE` | Whether mature content is enabled |
| `ReamDeviceKey` | Device identifier |
| `ReamDeviceFingerprint` | Base64 device fingerprint |

## Post-Login API Calls

After successful authentication, the client immediately calls:

1. `POST /api/user/stripe/subscription/list` — Fetches user's subscriptions
   - Body: `{"UserKey": "<userkey>", "Type": "members"}`
2. `POST /api/user/notification/count` — Gets unread notification count
3. `POST /api/user/restrictions/get` — Gets content restrictions
   - Body: `{}`
4. `POST /api/user/settings/get` — Gets user settings
   - Body: `{"UserKey": "<userkey>"}`

## Logout

Logout is **client-side only** — no API call is made. The client:

1. Removes session-related keys from `localStorage`:
   - `AUTH_TOKEN`, `USER_KEY`, `SID`, `DISPLAY_NAME`, `USER_EMAIL`, `USER_HANDLE`
   - `STRIPE_ACCOUNT_TYPE`, `CAN_SEE_MATURE`
2. Preserves device-related keys:
   - `ReamDeviceKey`, `ReamDeviceFingerprint`
3. Redirects to `/home`

**Notes:**
- No server-side session invalidation observed
- The `SID` from the previous session may still be valid on the server (untested)
- Device fingerprint persists across logins

## Error Handling

TODO: Document 401/403 responses, token expiration, and refresh behavior

## API Ports

| Port | Purpose | Base URL |
|------|---------|----------|
| 5001 | User API (auth, settings, notifications, subscriptions) | `https://reamstories.com:5001` |
| 5002 | Story API (posts, stories, bookmarks) | `https://reamstories.com:5002` |
| 5003 | Page API (author page management) | `https://reamstories.com:5003` |
