// All YouTube API calls are routed through a content script running inside a
// real youtube.com tab. Requests originating from that context are
// indistinguishable from YouTube's own JS, avoiding bot-detection 403s.

// ---------------------------------------------------------------------------
// Embed referrer fix
// ---------------------------------------------------------------------------
// YouTube requires a valid HTTP Referer on /embed/ requests (error 153
// otherwise). Extension pages (moz-extension://) never send one, so we inject
// a youtube.com Referer on embed sub_frame requests.
const debugState = {
  startedAt: new Date().toISOString(),
  webRequestListenerRegistered: false,
  embedRequestsModified: 0,
  lastEmbedUrl: null,
  lastEmbedModifiedAt: null,
  errors: [],
};

try {
  browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      // The page selects the Referer per embed strategy via the wla_ref param
      let referer = "https://www.youtube.com/";
      try {
        const custom = new URL(details.url).searchParams.get("wla_ref");
        if (custom && /^https:\/\//.test(custom)) referer = custom;
      } catch (_) {}

      const headers = details.requestHeaders.filter(
        (h) => h.name.toLowerCase() !== "referer"
      );
      headers.push({ name: "Referer", value: referer });
      debugState.embedRequestsModified++;
      debugState.lastEmbedUrl = details.url;
      debugState.lastRefererUsed = referer;
      debugState.lastEmbedModifiedAt = new Date().toISOString();
      return { requestHeaders: headers };
    },
    {
      urls: [
        "*://www.youtube-nocookie.com/embed/*",
        "*://www.youtube.com/embed/*",
      ],
      types: ["sub_frame"],
    },
    ["blocking", "requestHeaders"]
  );
  debugState.webRequestListenerRegistered = true;
} catch (err) {
  debugState.errors.push(`webRequest listener registration failed: ${err.message}`);
  console.error("[WLA background] webRequest listener:", err);
}

// Open the Watch Later tab when the toolbar icon is clicked.
browser.action.onClicked.addListener(async () => {
  const tabUrl = browser.runtime.getURL("pages/watchlater.html");
  const existing = await browser.tabs.query({ url: tabUrl });
  if (existing.length > 0) {
    browser.tabs.update(existing[0].id, { active: true });
    browser.windows.update(existing[0].windowId, { focused: true });
  } else {
    browser.tabs.create({ url: tabUrl });
  }
});

// ---------------------------------------------------------------------------
// Message handler — proxy to YouTube tab content script
// ---------------------------------------------------------------------------
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "get_debug") {
    sendResponse({ ok: true, debug: debugState });
    return false;
  }

  if (message.type === "fetch_wl") {
    proxyViaYouTubeTab({ type: "cs_fetch_wl", continuation: message.continuation ?? null })
      .then(r => sendResponse(r))
      .catch(err => {
        console.error("[WLA background] fetch_wl:", err);
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }

  if (message.type === "remove_video") {
    proxyViaYouTubeTab({
      type: "cs_remove_video",
      videoId: message.videoId,
      setVideoId: message.setVideoId,
      removeEndpoint: message.removeEndpoint,
    })
      .then(r => sendResponse(r))
      .catch(err => {
        console.error("[WLA background] remove_video:", err);
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }
});

// ---------------------------------------------------------------------------
// YouTube tab management
// ---------------------------------------------------------------------------
let cachedYtTabId = null;

async function proxyViaYouTubeTab(message) {
  const tabId = await getOrCreateYouTubeTab();
  return sendToTab(tabId, message);
}

async function getOrCreateYouTubeTab() {
  // Verify cached tab is still alive and has the content script loaded
  if (cachedYtTabId !== null) {
    try {
      const tab = await browser.tabs.get(cachedYtTabId);
      if (tab && !tab.discarded) {
        await sendToTab(cachedYtTabId, { type: "cs_ping" });
        return cachedYtTabId;
      }
    } catch (_) {}
    cachedYtTabId = null;
  }

  // Try any existing YouTube tab
  const tabs = await browser.tabs.query({ url: "*://*.youtube.com/*" });
  for (const tab of tabs) {
    try {
      await sendToTab(tab.id, { type: "cs_ping" });
      cachedYtTabId = tab.id;
      return cachedYtTabId;
    } catch (_) {}
  }

  // No suitable tab found — open a background one
  const tab = await browser.tabs.create({ url: "https://www.youtube.com", active: false });
  cachedYtTabId = tab.id;
  await waitForTabLoad(cachedYtTabId);
  await delay(400); // let content script initialise
  return cachedYtTabId;
}

function sendToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    browser.tabs.sendMessage(tabId, message, (response) => {
      if (browser.runtime.lastError) {
        reject(new Error(browser.runtime.lastError.message));
      } else if (!response) {
        reject(new Error("No response from content script — try reloading the YouTube tab"));
      } else {
        resolve(response);
      }
    });
  });
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (id, info) => {
      if (id === tabId && info.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    browser.tabs.onUpdated.addListener(listener);
    setTimeout(resolve, 10000); // safety fallback
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
