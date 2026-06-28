// Runs inside youtube.com tabs. All YouTube API calls are made from here so
// they originate in a real browser page context, avoiding bot detection.

// Build number reported to the background on cs_ping. Bump this whenever
// content.js changes in a way that the proxy tab must pick up, so the
// background reloads any tab running stale code instead of using it.
const WLA_CS_VERSION = 12;

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "cs_ping") {
    sendResponse({ ok: true, version: WLA_CS_VERSION });
    return false;
  }
  if (message.type === "cs_fetch_wl") {
    handleFetchWL(message.continuation)
      .then(r => sendResponse({ ok: true, ...r }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (message.type === "cs_remove_video") {
    handleRemoveVideo(message.videoId, message.setVideoId, message.removeEndpoint)
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (message.type === "cs_fetch_comments") {
    handleFetchComments(message.videoId, message.limit ?? 30)
      .then(comments => sendResponse({ ok: true, comments }))
      .catch(err => {
        // Comments are best-effort: report ok with empty list so the caller
        // can still run summary/tags, but include the reason for debugging.
        console.warn("[WLA content] fetch_comments failed:", err);
        sendResponse({ ok: true, comments: [], error: err.message });
      });
    return true;
  }

});

// ---------------------------------------------------------------------------
// Fetch Watch Later playlist — first page
// ---------------------------------------------------------------------------
async function handleFetchWL(continuation) {
  if (continuation) return fetchContinuation(continuation);

  const resp = await fetch("https://www.youtube.com/playlist?list=WL", {
    credentials: "include",
    headers: { "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!resp.ok) throw new Error(`YouTube returned HTTP ${resp.status}`);

  const html = await resp.text();

  const dataMatch = html.match(/var ytInitialData\s*=\s*(\{[\s\S]+?\});\s*<\/script>/);
  if (!dataMatch) throw new Error("Could not find ytInitialData — YouTube page structure may have changed");

  const data = JSON.parse(dataMatch[1]);

  // If the playlist body says we need to sign in, surface it cleanly
  const alertText = data?.alerts?.[0]?.alertWithButtonRenderer?.text?.simpleText
    ?? data?.alerts?.[0]?.alertRenderer?.text?.simpleText;
  if (alertText && /sign in|log in/i.test(alertText)) {
    throw new Error("NOT_LOGGED_IN");
  }

  // Cache ytcfg for use in remove calls
  _config = parseYtcfgFromHtml(html) ?? readLiveYtcfg();

  return parsePlaylistData(data);
}

// ---------------------------------------------------------------------------
// Fetch continuation page (> ~100 videos)
// ---------------------------------------------------------------------------
async function fetchContinuation(continuation) {
  const cfg = getConfig();
  const resp = await fetch(
    "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": cfg.clientVersion,
        "X-Origin": "https://www.youtube.com",
      },
      body: JSON.stringify({ context: buildContext(cfg), continuation }),
    }
  );
  if (!resp.ok) throw new Error(`InnerTube browse returned HTTP ${resp.status}`);
  const json = await resp.json();

  const contents =
    json?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems ?? [];
  const videos = contents.filter(i => i.playlistVideoRenderer).map(parseVideoItem);
  const nextToken =
    contents.find(i => i.continuationItemRenderer)
      ?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ?? null;

  return { videos, continuation: nextToken, header: null };
}

// ---------------------------------------------------------------------------
// Remove a video from Watch Later
// ---------------------------------------------------------------------------
async function handleRemoveVideo(videoId, setVideoId, removeEndpoint) {
  const cfg = getConfig();
  const sapisidhash = await buildSapisidhash();

  console.log("[WLA content] remove_video input:", { videoId, setVideoId, removeEndpoint });

  // Build the request body from the page-provided endpoint. We sanitise it:
  //   - URL-decode `params` (ytInitialData stores it URL-encoded because the
  //     endpoint is also embedded in href links; the API expects raw base64)
  //   - drop `clientActions` and `clickTrackingParams` which are client-side
  //     metadata and not part of the InnerTube request body
  let payload;
  if (removeEndpoint && removeEndpoint.playlistId) {
    const { clientActions, clickTrackingParams, ...clean } = removeEndpoint;
    if (typeof clean.params === "string" && clean.params.includes("%")) {
      try { clean.params = decodeURIComponent(clean.params); } catch (_) {}
    }
    payload = { ...clean, context: buildContext(cfg) };
  } else if (setVideoId) {
    payload = {
      context: buildContext(cfg),
      playlistId: "WL",
      actions: [{ action: "ACTION_REMOVE_VIDEO", setVideoId }],
    };
  } else {
    throw new Error("No remove endpoint and no setVideoId available — cannot remove");
  }

  console.log("[WLA content] remove_video payload:", JSON.stringify(payload, null, 2));

  // Decode visitorData for header use (same reason as in buildContext)
  let visitorIdHeader = cfg.visitorData || "";
  if (visitorIdHeader.includes("%")) {
    try { visitorIdHeader = decodeURIComponent(visitorIdHeader); } catch (_) {}
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": sapisidhash,
    "X-Origin": "https://www.youtube.com",
    "X-Goog-AuthUser": "0",
    "X-YouTube-Client-Name": "1",
    "X-YouTube-Client-Version": cfg.clientVersion,
    "X-YouTube-Bootstrap-Logged-In": cfg.loggedIn || "true",
  };
  if (cfg.pageId) headers["X-Goog-PageId"] = cfg.pageId;
  if (visitorIdHeader) headers["X-Goog-Visitor-Id"] = visitorIdHeader;

  const resp = await fetch(
    "https://www.youtube.com/youtubei/v1/browse/edit_playlist?prettyPrint=false",
    {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(payload),
    }
  );

  if (!resp.ok) {
    const raw = await resp.text().catch(() => "");
    throw new Error(`InnerTube edit_playlist returned HTTP ${resp.status}\n\n${extractText(raw)}`);
  }

  const json = await resp.json();
  console.log("[WLA content] edit_playlist response:", json);

  // YouTube reports success via `status: STATUS_SUCCEEDED`. If status is missing
  // or anything else, treat as failure so silent no-ops surface as errors.
  if (json?.status !== "STATUS_SUCCEEDED") {
    throw new Error(
      `Remove failed — YouTube responded with: ${JSON.stringify(json).slice(0, 600)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Fetch top comments for a video (two-step InnerTube /next dance)
// ---------------------------------------------------------------------------
async function handleFetchComments(videoId, limit) {
  const cfg = getConfig();

  // Step 1: the watch-page /next response contains the comments-section
  // continuation token.
  const first = await innertubeNext({ videoId }, cfg);
  const token = findCommentsContinuation(first);
  if (!token) throw new Error("No comments continuation found (comments may be disabled)");

  // Step 2: fetch the actual comments.
  const second = await innertubeNext({ continuation: token }, cfg);
  const comments = extractCommentTexts(second);
  return comments.slice(0, limit);
}

async function innertubeNext(body, cfg) {
  const resp = await fetch("https://www.youtube.com/youtubei/v1/next?prettyPrint=false", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": cfg.clientVersion,
      "X-Origin": "https://www.youtube.com",
    },
    body: JSON.stringify({ context: buildContext(cfg), ...body }),
  });
  if (!resp.ok) throw new Error(`InnerTube next returned HTTP ${resp.status}`);
  return resp.json();
}

// The comments continuation lives in an itemSectionRenderer with
// sectionIdentifier "comment-item-section" (location varies by layout).
function findCommentsContinuation(data) {
  let found = null;
  (function walk(obj, depth) {
    if (found || !obj || typeof obj !== "object" || depth > 14) return;
    const isr = obj.itemSectionRenderer;
    if (isr && /comment/i.test(isr.sectionIdentifier ?? "")) {
      const token = isr.contents?.[0]?.continuationItemRenderer
        ?.continuationEndpoint?.continuationCommand?.token;
      if (token) { found = token; return; }
    }
    for (const key of Object.keys(obj)) walk(obj[key], depth + 1);
  })(data, 0);
  return found;
}

// Comment text lives in two places depending on YouTube's rollout:
//   old: commentThreadRenderer.comment.commentRenderer.contentText.runs
//   new: frameworkUpdates...mutations[].payload.commentEntityPayload
function extractCommentTexts(data) {
  const texts = [];

  const mutations = data?.frameworkUpdates?.entityBatchUpdate?.mutations ?? [];
  for (const m of mutations) {
    const content = m?.payload?.commentEntityPayload?.properties?.content?.content;
    if (content) texts.push(content);
  }

  if (texts.length === 0) {
    (function walk(obj, depth) {
      if (!obj || typeof obj !== "object" || depth > 16) return;
      const runs = obj.commentRenderer?.contentText?.runs;
      if (runs) {
        const t = runs.map(r => r.text ?? "").join("");
        if (t) texts.push(t);
      }
      for (const key of Object.keys(obj)) walk(obj[key], depth + 1);
    })(data, 0);
  }

  // Normalize: collapse whitespace, drop empties, cap length per comment
  return texts
    .map(t => t.replace(/\s+/g, " ").trim().slice(0, 500))
    .filter(Boolean);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// SAPISID hash — YouTube's frontend computes a hash for each of the three
// SAPISID cookies and concatenates them into a single Authorization header.
// Mutation endpoints (like edit_playlist) validate against the 1P/3P hashes,
// so sending only one is what was causing the FAILED_PRECONDITION 400.
// ---------------------------------------------------------------------------
async function buildSapisidhash(suffix = "") {
  const cookieMap = parseCookies(document.cookie);
  const pairs = [
    ["SAPISID", "SAPISIDHASH"],
    ["__Secure-1PAPISID", "SAPISID1PHASH"],
    ["__Secure-3PAPISID", "SAPISID3PHASH"],
  ];

  const timestamp = Math.floor(Date.now() / 1000);
  const parts = [];
  for (const [cookieName, hashLabel] of pairs) {
    const value = cookieMap[cookieName];
    if (!value) continue;
    const message = `${timestamp} ${value} https://www.youtube.com`;
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(message));
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    // YouTube's newer requests append a scheme suffix (e.g. "_u") to each hash.
    parts.push(`${hashLabel} ${timestamp}_${hex}${suffix}`);
  }

  if (parts.length === 0) {
    throw new Error("No SAPISID cookies found — are you logged into YouTube?");
  }
  return parts.join(" ");
}

function parseCookies(cookieStr) {
  const map = {};
  for (const part of cookieStr.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0) map[part.slice(0, i)] = part.slice(i + 1);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
let _config = null;

function getConfig() {
  if (_config) return _config;
  _config = readLiveYtcfg();
  return _config;
}

function readLiveYtcfg() {
  try {
    if (window.ytcfg?.get) {
      return {
        clientVersion: window.ytcfg.get("INNERTUBE_CLIENT_VERSION") || "2.20250101.00.00",
        visitorData: window.ytcfg.get("VISITOR_DATA") || "",
        pageId: window.ytcfg.get("DELEGATED_SESSION_ID") || "",
        loggedIn: window.ytcfg.get("LOGGED_IN") ? "true" : "false",
      };
    }
  } catch (_) {}
  return { clientVersion: "2.20250101.00.00", visitorData: "", pageId: "", loggedIn: "true" };
}

function parseYtcfgFromHtml(html) {
  for (const m of html.matchAll(/ytcfg\.set\s*\((\{[\s\S]+?\})\)\s*;/g)) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj.INNERTUBE_CLIENT_VERSION) {
        return {
          clientVersion: obj.INNERTUBE_CLIENT_VERSION,
          visitorData: obj.VISITOR_DATA ?? "",
          pageId: obj.DELEGATED_SESSION_ID ?? "",
          loggedIn: obj.LOGGED_IN ? "true" : "false",
        };
      }
    } catch (_) {}
  }
  return null;
}

function buildContext(cfg) {
  const ctx = { client: { clientName: "WEB", clientVersion: cfg.clientVersion, hl: "en" } };
  if (cfg.visitorData) {
    // visitorData is URL-encoded in ytcfg/ytInitialData; the API wants raw base64.
    let v = cfg.visitorData;
    if (v.includes("%")) { try { v = decodeURIComponent(v); } catch (_) {} }
    ctx.client.visitorData = v;
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Playlist parsing
// ---------------------------------------------------------------------------
function parsePlaylistData(data) {
  const tab = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content;
  const section = tab?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0];
  const renderer = section?.playlistVideoListRenderer;
  if (!renderer) throw new Error("Unexpected YouTube page structure — could not find playlist data");

  const videos = (renderer.contents || []).filter(i => i.playlistVideoRenderer).map(parseVideoItem);
  const continuation = renderer.continuations?.[0]?.nextContinuationData?.continuation ?? null;
  const header = data?.header?.playlistHeaderRenderer?.title?.simpleText ?? "Watch Later";
  return { videos, continuation, header };
}

let _debuggedFirstItem = false;

function parseVideoItem(item) {
  const v = item.playlistVideoRenderer;
  const thumbnails = v?.thumbnail?.thumbnails ?? [];
  const thumbnail = thumbnails.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";

  // One-time dump of the raw playlistVideoRenderer so we can see what
  // structure YouTube is actually sending and where the remove action lives.
  if (!_debuggedFirstItem) {
    _debuggedFirstItem = true;
    console.log("[WLA content] First playlistVideoRenderer (full):", v);
    console.log("[WLA content] menu.menuRenderer.items:", v?.menu?.menuRenderer?.items);
  }

  // Try to find the exact playlistEditEndpoint that YouTube wired up for this
  // video — replaying it verbatim avoids FAILED_PRECONDITION 400s.
  // We deep-walk the entire renderer because the endpoint can live in the
  // 3-dot menu OR the thumbnail overlay (X button) depending on the layout.
  const removeEndpoint = findPlaylistEditEndpoint(v);

  return {
    videoId: v?.videoId ?? "",
    setVideoId: v?.setVideoId ?? "",
    title: v?.title?.runs?.[0]?.text ?? v?.title?.simpleText ?? "(no title)",
    channel: v?.shortBylineText?.runs?.[0]?.text ?? "",
    duration: v?.lengthText?.simpleText ?? "",
    uploadDate: v?.publishedTimeText?.simpleText ?? "",
    description: v?.descriptionSnippet?.runs?.[0]?.text ?? "",
    thumbnail,
    removeEndpoint,
  };
}

// Recursively walk an object looking for a `playlistEditEndpoint` whose
// actions include a REMOVE-type entry. Returns the first match or null.
function findPlaylistEditEndpoint(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 12) return null;
  if (obj.playlistEditEndpoint) {
    const pe = obj.playlistEditEndpoint;
    const actions = pe.actions ?? [];
    if (actions.some(a => /REMOVE/i.test(a?.action ?? ""))) {
      return pe;
    }
  }
  for (const key of Object.keys(obj)) {
    const found = findPlaylistEditEndpoint(obj[key], depth + 1);
    if (found) return found;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Strip HTML tags to get readable text from error pages
// ---------------------------------------------------------------------------
function extractText(html) {
  let t = html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  return t.replace(/\s+/g, " ").trim() || "(empty response body)";
}
