# YT Watch Later Triage

A Firefox browser extension that displays your YouTube Watch Later list in a clean, dedicated tab — with thumbnails, titles, channel names, durations, upload dates, and one-click removal.

No server required. No API keys. No cookie exports. It runs inside your already-authenticated Firefox session.

---

## How it works

YouTube's official Data API blocks Watch Later access. This extension sidesteps that by fetching `youtube.com/playlist?list=WL` directly from within Firefox, where your session cookies are already present. It parses YouTube's embedded page data (`ytInitialData`) to extract video metadata. Removal is handled via YouTube's internal InnerTube API using the same authenticated session.

---

## Install (Firefox, developer mode)

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on…**
4. Navigate to this folder and select `manifest.json`
5. The extension icon appears in your toolbar

> **Note:** Temporary add-ons are removed when Firefox restarts. For a permanent install, the extension would need to be signed by Mozilla (not required for personal/dev use).

---

## Usage

1. Make sure you are **logged into YouTube** in Firefox
2. Click the **YT Watch Later Triage** icon in the toolbar
3. A new tab opens with your Watch Later list
4. Click any thumbnail or title to open the video on YouTube
5. Click **Remove** on a card to remove it from your Watch Later list
6. Click **Refresh** to reload the list

---

## Permissions requested

| Permission | Why |
|---|---|
| `*://*.youtube.com/*` (host) | Fetch the Watch Later playlist page and call the InnerTube remove API |
| `cookies` | Read the `SAPISID` cookie to authenticate remove requests |
| `tabs` | Open the Watch Later tab when the toolbar icon is clicked |

---

## Known limitations

- **YouTube internals may change.** The extension parses `ytInitialData`, an undocumented internal structure. If YouTube changes their page format, the parsing code may need updating.
- **~100 videos per page.** The first load shows up to 100 videos. Use "Load more" to fetch additional pages.
- **Firefox only (PoC).** Chrome's MV3 service workers handle credentialed fetches differently; Chrome support would require adjustments.
- **Temporary install.** Without Mozilla signing, the extension must be reloaded after each Firefox restart via `about:debugging`.

---

## File structure

```
yt-watch-later-triage/
├── manifest.json         Extension manifest (MV3)
├── background.js         Fetches playlist data + handles remove API calls
├── pages/
│   ├── watchlater.html   Tab page UI
│   ├── watchlater.js     Rendering, remove UX, message passing
│   └── watchlater.css    Dark-themed card grid layout
└── icons/
    ├── icon-48.png
    └── icon-96.png
```

---

## License

MIT
