# YT Watch Later Triage — Technical Summary

## Architecture

All YouTube API calls are made from a content script running inside a real `youtube.com` tab, not from the background script. This is required because:
- Firefox's Total Cookie Protection partitions cookies by first-party context; background script fetches don't get YouTube's session cookies
- YouTube's bot detection flags requests that don't originate from within a real page context

**Flow:**
1. User clicks extension icon → `background.js` opens/focuses `pages/watchlater.html` tab
2. UI page sends messages (`fetch_wl`, `remove_video`) to `background.js`
3. `background.js` proxies them to the content script in a YouTube tab via `browser.tabs.sendMessage`
4. Content script (`content.js`) performs all actual HTTP requests and returns results

## Fetching the Watch Later List

- Fetch `https://www.youtube.com/playlist?list=WL` with `credentials: "include"`
- Extract `var ytInitialData = {...}` from the HTML response (regex match)
- Parse path: `contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents`
- Also parse `ytcfg` from the HTML (`ytcfg.set({...})`) to get `clientVersion`, `visitorData`, `DELEGATED_SESSION_ID`, `LOGGED_IN`
- Fall back to `window.ytcfg.get()` if HTML parse fails

**Continuation (> ~100 videos):** POST to `/youtubei/v1/browse` with continuation token; parse `onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems`

## Removing a Video

POST to `https://www.youtube.com/youtubei/v1/browse/edit_playlist?prettyPrint=false`

**Required headers (all critical):**
```
Content-Type: application/json
Authorization: SAPISIDHASH t_hex SAPISID1PHASH t_hex SAPISID3PHASH t_hex
X-Origin: https://www.youtube.com
X-Goog-AuthUser: 0
X-YouTube-Client-Name: 1
X-YouTube-Client-Version: <from ytcfg>
X-YouTube-Bootstrap-Logged-In: true
X-Goog-PageId: <DELEGATED_SESSION_ID from ytcfg>   ← critical, binds request to account
X-Goog-Visitor-Id: <VISITOR_DATA from ytcfg, URL-decoded>
```

**SAPISIDHASH computation** (all three cookies, concatenated with space):
```
For each of: SAPISID, __Secure-1PAPISID, __Secure-3PAPISID
  message = "${timestamp} ${cookieValue} https://www.youtube.com"
  hash = SHA-1(message) as hex
  part = "SAPISIDHASH|SAPISID1PHASH|SAPISID3PHASH ${timestamp}_${hash}"
Authorization = parts.join(" ")
```

**Preferred payload** (verbatim from `playlistEditEndpoint` extracted from `playlistVideoRenderer`):
```json
{
  "playlistId": "WL",
  "actions": [{ "action": "ACTION_REMOVE_VIDEO", "setVideoId": "<setVideoId>" }],
  "params": "CAFAAQ==",
  "context": { "client": { "clientName": "WEB", "clientVersion": "...", "visitorData": "..." } }
}
```

**Important:** `params` and `visitorData` are stored URL-encoded in `ytInitialData` (e.g. `CAFAAQ%3D%3D`). Always `decodeURIComponent` them before putting in the API body.

The `playlistEditEndpoint` is embedded in each video's `playlistVideoRenderer` (deep inside the menu or overlay). `findPlaylistEditEndpoint()` walks the full renderer tree to find it. If not found, fall back to constructing the payload with just `setVideoId`.

**Success check:** Response must have `status: "STATUS_SUCCEEDED"`. Anything else is an error.

## What Will Break If YouTube Changes

- `ytInitialData` parse path — YouTube occasionally restructures their HTML
- `playlistEditEndpoint` location within `playlistVideoRenderer`
- Required headers for `edit_playlist` — the `X-Goog-PageId` requirement was discovered by capturing YouTube's own requests via an injected fetch interceptor; YouTube may add more required headers
- `SAPISIDHASH` scheme — YouTube could rotate to a different auth mechanism
- InnerTube API endpoint paths

## Debug Tool

`content.js` contains an injected page-world fetch interceptor that logs all YouTube `/youtubei/v1/` POST requests (URL, method, headers, body) to the browser console. This was used to discover the missing `X-Goog-PageId` header. It runs automatically but is harmless; can be removed once no longer needed.
