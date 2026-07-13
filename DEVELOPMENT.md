# Development

Technical notes for working on this repo: how the extension talks to the outside world, local setup, and the release process. For what the extension does and how to install it, see [README.md](README.md).

---

## How the extension talks to the outside world

There are three separate request patterns in this codebase, each with a different reason for existing:

1. **YouTube data** (playlist, comments, remove) — proxied through a real YouTube tab's content script.
2. **AI analysis** — sent directly from the extension's own tab page to whichever provider the user configured.
3. **Transcripts** — sent directly from the background script to the local harvester service.

### 1. YouTube data (playlist, comments, remove)

All YouTube API calls are made from a content script running inside a real `youtube.com` tab, not from the background script. This is required because:
- Firefox's Total Cookie Protection partitions cookies by first-party context; background script fetches don't get YouTube's session cookies
- YouTube's bot detection flags requests that don't originate from within a real page context

**Flow:**
1. User clicks extension icon → `background.js` opens/focuses `pages/watchlater.html` tab
2. UI page sends messages (`fetch_wl`, `fetch_comments`, `remove_video`) to `background.js`
3. `background.js` proxies them to the content script in a YouTube tab via `browser.tabs.sendMessage`
4. Content script (`content.js`) performs all actual HTTP requests and returns results

#### Fetching the Watch Later list

- Fetch `https://www.youtube.com/playlist?list=WL` with `credentials: "include"`
- Extract `var ytInitialData = {...}` from the HTML response (regex match)
- Parse path: `contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents`
- Also parse `ytcfg` from the HTML (`ytcfg.set({...})`) to get `clientVersion`, `visitorData`, `DELEGATED_SESSION_ID`, `LOGGED_IN`
- Fall back to `window.ytcfg.get()` if HTML parse fails

**Continuation (> ~100 videos):** POST to `/youtubei/v1/browse` with continuation token; parse `onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems`

#### Removing a video

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

#### What will break if YouTube changes

- `ytInitialData` parse path — YouTube occasionally restructures their HTML
- `playlistEditEndpoint` location within `playlistVideoRenderer`
- Required headers for `edit_playlist` — the `X-Goog-PageId` requirement was discovered by capturing YouTube's own requests via an injected fetch interceptor (since removed; see Debugging below); YouTube may add more required headers
- `SAPISIDHASH` scheme — YouTube could rotate to a different auth mechanism
- InnerTube API endpoint paths

### 2. AI analysis

`pages/ai.js` calls the configured provider's API **directly** from the extension's own tab page — no background script or content script involved, since these endpoints don't need YouTube's session cookies. The full flow, driven by `ensureAnalysis()` in `pages/watchlater.js`:

1. Check the analysis cache (`analysis:<videoId>` in `browser.storage.local`, bounded to 200 entries via an `analysisIndex` that evicts the oldest entry on overflow). If cached, render it and stop.
2. Fetch comments and transcript **in parallel** (`Promise.allSettled`) — both are best-effort; either can fail without blocking the other. See "3. Transcripts" below for the transcript half.
3. Build the prompt (`WLA_PROMPTS.buildPrompt()`, in `pages/prompts.js`) and cache it (`debug:<videoId>`) — *before* calling the AI, so the Inspect modal has something to show even if the API call fails.
4. Call `WLA_AI.analyze()`, which POSTs directly to either:
   - `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent` (Gemini), or
   - `https://api.anthropic.com/v1/messages` (Claude, with `anthropic-dangerous-direct-browser-access: true` — required since this is a browser-originated request, not a server).
5. Parse the response as JSON (stripping markdown fences the model sometimes adds despite instructions), validate the shape, and cache the result.

API keys live in `browser.storage.local` under `aiSettings`, per-provider (`{ provider, gemini: {apiKey, model}, claude: {apiKey, model} }`). They're never sent anywhere except the provider's own API — there's no backend to leak through.

### 3. Transcripts

`background.js` calls the local transcript harvester **directly** via `fetchTranscriptViaHarvester()` — also bypassing the content-script proxy, since transcripts for public videos need no YouTube session at all (only the Watch Later *list* itself is private).

- Checked against a separate cache first (`transcript:<videoId>`): `status: "ok"` or `"none"` are treated as permanent facts about the video and never re-fetched; `status: "offline"` (harvester unreachable) is always retried on the next analysis.
- The harvester itself (`harvester/transcript.js`) fetches via the [`yt-caption-kit`](https://www.npmjs.com/package/yt-caption-kit) npm package — no headless browser, no login. An earlier design considered driving a real Playwright browser to open the YouTube transcript panel (the only approach that reliably worked when done by hand), but `yt-caption-kit` reaches the same public endpoint YouTube's transcript panel uses without needing to render a page at all, which turned out to be simpler and faster. Requests are serialized through a one-at-a-time queue to avoid hammering YouTube.
- If the harvester is down or a video has no transcript, AI analysis still proceeds on metadata + comments alone — never blocked on the transcript.

### Debugging

- **"Copy debug info" button** (`pages/watchlater.js`) — appears automatically after the first console error. Copies a dump to the clipboard: extension version, current video/player state, and a ring buffer of the last 300 logged errors/warnings, plus `background.js`'s own debug state (embed strategy, last error, etc.) fetched via a `get_debug` message.
- **AI Inspect modal** — shows the exact transcript and prompt sent to the AI for the current video, from the `debug:<videoId>` cache described above. Useful for seeing exactly what the model saw when a result looks wrong.
- The old page-world fetch interceptor that logged raw `/youtubei/v1/` requests (used to discover the `X-Goog-PageId` header requirement) was removed along with the browser-automation transcript code it was built for; the two tools above replaced it.

---

## Working on this repo

This repo has two runnable pieces beyond the extension itself: a Storybook-driven web component library and the transcript harvester service.

### Local Storybook

```bash
npm install
npm run storybook       # dev server at localhost:6006
npm run build-storybook # static build → storybook-static/
```

### Building the extension's component bundle

The extension page can't use bare `import 'lit'` specifiers (browsers can't resolve them, and the MV3 CSP blocks inline scripts), so `pages/components.js` — which imports the `wla-*` components — gets bundled into a self-contained `pages/components.bundle.js` via esbuild:

```bash
npm run build         # one-off build
npm run build:watch   # rebuild on change, while editing components/
```

Run this after any change under `components/`; `pages/components.bundle.js` is gitignored and must exist locally for the unpacked extension to load.

### Releasing a new version

Pushing a version tag builds, signs, and publishes automatically (`.github/workflows/release.yml`):

1. Bump `"version"` in `manifest.json` (e.g. `0.1.0` → `0.2.0`).
2. Commit, then tag and push:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
3. CI builds the component bundle, lints the packaged extension, signs it via Mozilla's AMO API (unlisted channel — reviewed automatically, not publicly listed), and attaches the signed `.xpi` to a new GitHub Release.

The workflow refuses to run if the tag version doesn't match `manifest.json`. It needs two repo secrets set once under **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `AMO_JWT_ISSUER` | [addons.mozilla.org → Manage API Keys](https://addons.mozilla.org/developers/addon/api/key/) |
| `AMO_JWT_SECRET` | Same page — shown once when the keypair is generated |

### Publishing a new harvester image

The harvester's Docker image is decoupled from the extension's release tags — it versions independently, since it changes far less often. `.github/workflows/harvester-release.yml` triggers only on a push to `master` that touches `harvester/**` (no tag needed):

1. Make your change under `harvester/`.
2. Bump `"version"` in `harvester/package.json`.
3. Commit and push to `master` as normal.

CI then builds `harvester/Dockerfile` and pushes both `ghcr.io/davidslr/wla-transcript-harvester:latest` and `:<version>` to GitHub Container Registry. If you forget step 2, the workflow fails rather than silently overwriting an already-published version tag — version tags are meant to be immutable, only `:latest` floats.

No secrets to configure — GHCR auth uses the workflow's own `GITHUB_TOKEN`. The one manual step is on first publish only: the package defaults to private, so flip it to public once under your GitHub profile → **Packages** → `wla-transcript-harvester` → **Package settings**.
