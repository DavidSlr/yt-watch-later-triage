// Runs inside youtube.com tabs. All YouTube API calls are made from here so
// they originate in a real browser page context, avoiding bot detection.

// ---------------------------------------------------------------------------
// DEBUG: inject a fetch interceptor into the page world to log YouTube's own
// requests to /youtubei/v1/. Once enabled, clicking the native "Remove from
// Watch later" X on any video will dump the real request payload to the
// console so we can compare against what our extension is sending.
// ---------------------------------------------------------------------------
(function injectFetchLogger() {
  if (document.getElementById("wla-fetch-logger")) return;
  const s = document.createElement("script");
  s.id = "wla-fetch-logger";
  s.textContent = `
    (function() {
      if (window.__wlaPatched) return;
      window.__wlaPatched = true;
      const orig = window.fetch;
      window.fetch = function(input, init) {
        const isReq = (typeof Request !== "undefined") && (input instanceof Request);
        const url = isReq ? input.url : (typeof input === "string" ? input : input?.url);
        const method = (init?.method || (isReq ? input.method : "GET")).toUpperCase();

        // Filter for the edit_playlist call (and a few related mutations)
        const interesting = url && /\\/youtubei\\/v1\\/(browse\\/edit_playlist|playlist\\/(create|delete)|browse|feedback)/.test(url) && method === "POST";

        if (interesting) {
          // Clone the body source so we can read it without consuming the original
          const clone = isReq ? input.clone() : null;
          const initBody = init?.body;

          // Read headers
          const headers = {};
          if (init?.headers) {
            if (init.headers instanceof Headers) {
              for (const [k, v] of init.headers.entries()) headers[k] = v;
            } else if (Array.isArray(init.headers)) {
              for (const [k, v] of init.headers) headers[k] = v;
            } else {
              Object.assign(headers, init.headers);
            }
          }
          if (isReq) {
            for (const [k, v] of input.headers.entries()) {
              if (!(k in headers)) headers[k] = v;
            }
          }

          // Read body (Promise so we can await async sources like Request.text())
          const bodyPromise = (async () => {
            if (typeof initBody === "string") return initBody;
            if (initBody instanceof Blob) return await initBody.text();
            if (initBody instanceof ArrayBuffer) return new TextDecoder().decode(initBody);
            if (initBody instanceof FormData) return Object.fromEntries(initBody.entries());
            if (clone) return await clone.text();
            return initBody;
          })();

          bodyPromise.then((body) => {
            console.log("%c[YT fetch intercept] " + url, "color:#4ade80;font-weight:bold");
            console.log("  method:", method);
            console.log("  headers:", headers);
            try { console.log("  body:", typeof body === "string" ? JSON.parse(body) : body); }
            catch (_) { console.log("  body (raw):", body); }
          }).catch((e) => console.warn("[YT fetch intercept] body read error:", e));
        }

        return orig.apply(this, arguments);
      };
      console.log("%c[WLA] fetch interceptor installed", "color:#4ade80");
    })();
  `;
  (document.head || document.documentElement).appendChild(s);
})();

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "cs_ping") {
    sendResponse({ ok: true });
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
// SAPISID hash — YouTube's frontend computes a hash for each of the three
// SAPISID cookies and concatenates them into a single Authorization header.
// Mutation endpoints (like edit_playlist) validate against the 1P/3P hashes,
// so sending only one is what was causing the FAILED_PRECONDITION 400.
// ---------------------------------------------------------------------------
async function buildSapisidhash() {
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
    parts.push(`${hashLabel} ${timestamp}_${hex}`);
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
