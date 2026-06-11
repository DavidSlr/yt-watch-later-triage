// ── State ────────────────────────────────────────────────────────────────────
let allVideos = [];
let nextContinuation = null;
let lastSyncTime = null;
let currentVideoId = null;

// ── Debug log ─────────────────────────────────────────────────────────────────
// Ring buffer of recent events; dumped to clipboard via the debug button.
const debugLog = [];

function dbg(level, ...args) {
  const line = `[${new Date().toISOString()}] ${level}: ${args
    .map(a => (typeof a === "string" ? a : safeJson(a)))
    .join(" ")}`;
  debugLog.push(line);
  if (debugLog.length > 300) debugLog.shift();
}

function safeJson(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

function showDebugButton() {
  const btn = document.getElementById("debug-btn");
  if (btn) btn.hidden = false;
}

// Mirror console.error/warn into the debug log; errors reveal the button
for (const level of ["error", "warn"]) {
  const orig = console[level].bind(console);
  console[level] = (...args) => {
    dbg(level.toUpperCase(), ...args);
    if (level === "error") showDebugButton();
    orig(...args);
  };
}

window.addEventListener("error", (e) => {
  dbg("ERROR", `window.onerror: ${e.message} @ ${e.filename}:${e.lineno}`);
  showDebugButton();
});
window.addEventListener("unhandledrejection", (e) => {
  dbg("ERROR", `unhandledrejection: ${e.reason?.message ?? e.reason}`);
  showDebugButton();
});

async function copyDebugInfo() {
  const manifest = browser.runtime.getManifest();
  let bgDebug;
  try {
    bgDebug = (await sendMessage({ type: "get_debug" })).debug;
  } catch (e) {
    bgDebug = `unavailable: ${e.message}`;
  }
  return [
    `YT Watch Later Triage — debug dump ${new Date().toISOString()}`,
    `Extension version: ${manifest.version}`,
    `User agent: ${navigator.userAgent}`,
    `Current video: ${currentVideoId}`,
    `Embed src: ${document.getElementById("yt-player")?.src}`,
    `Videos loaded: ${allVideos.length}, has continuation: ${!!nextContinuation}`,
    `Background state: ${safeJson(bgDebug)}`,
    ``,
    `--- Event log (${debugLog.length} entries) ---`,
    ...debugLog,
  ].join("\n");
}

// ── Player postMessage protocol ───────────────────────────────────────────────
// The embed's widget API works over postMessage without the (CSP-blocked)
// external iframe_api script. After sending "listening", the player reports
// events including onError with the exact error code.
const YT_ERROR_MEANINGS = {
  2:   "invalid video id",
  5:   "HTML5 player error",
  100: "video not found or private",
  101: "embedding disabled by video owner",
  150: "embedding disabled by video owner",
  152: "embed rejected (referrer/origin not accepted)",
  153: "missing/invalid HTTP Referer on embed request",
};

// ── Embed strategies ──────────────────────────────────────────────────────────
// YouTube rejects embeds based on host/referrer combinations that it considers
// invalid. On error 152/153 we walk this chain automatically; the first working
// strategy sticks for subsequent videos. The wla_ref param tells background.js
// which Referer to inject on the embed request.
// Ordered by known success rate: YouTube rejects its own domain as a
// referrer (error 152), while a google.com referrer is accepted.
const EMBED_STRATEGIES = [
  { host: "www.youtube.com",          ref: "https://www.google.com/" },
  { host: "www.youtube-nocookie.com", ref: "https://www.google.com/" },
  { host: "www.youtube.com",          ref: "https://www.youtube.com/" },
  { host: "www.youtube-nocookie.com", ref: "https://www.youtube.com/" },
];
let strategyIndex = 0;
let savedStrategyIndex = null;
let strategyConfirmTimer = null;

// Restore the last strategy that demonstrably played a video
async function loadSavedStrategy() {
  try {
    const { embedStrategy } = await browser.storage.local.get("embedStrategy");
    if (Number.isInteger(embedStrategy) && embedStrategy >= 0 && embedStrategy < EMBED_STRATEGIES.length) {
      strategyIndex = embedStrategy;
      savedStrategyIndex = embedStrategy;
      dbg("INFO", `Using saved embed strategy ${strategyIndex}:`, EMBED_STRATEGIES[strategyIndex]);
    }
  } catch (e) {
    dbg("WARN", `Could not read saved embed strategy: ${e.message}`);
  }
}

// Called on player ready; if no error follows within 3s, persist the strategy.
// onError cancels the timer, so only genuinely working strategies are saved.
function confirmStrategySoon() {
  clearTimeout(strategyConfirmTimer);
  if (strategyIndex === savedStrategyIndex) return;
  strategyConfirmTimer = setTimeout(() => {
    browser.storage.local.set({ embedStrategy: strategyIndex }).then(
      () => {
        savedStrategyIndex = strategyIndex;
        dbg("INFO", `Embed strategy ${strategyIndex} confirmed working — saved for future sessions`);
      },
      (e) => dbg("WARN", `Could not save embed strategy: ${e.message}`)
    );
  }, 3000);
}

function embedSrc(videoId) {
  const s = EMBED_STRATEGIES[strategyIndex];
  return `https://${s.host}/embed/${encodeURIComponent(videoId)}` +
    `?rel=0&fs=1&enablejsapi=1&wla_ref=${encodeURIComponent(s.ref)}`;
}

function retryEmbed() {
  if (strategyIndex >= EMBED_STRATEGIES.length - 1) return false;
  strategyIndex++;
  dbg("INFO", `Retrying with embed strategy ${strategyIndex}:`, EMBED_STRATEGIES[strategyIndex]);
  ytPlayerEl.src = embedSrc(currentVideoId);
  playerHandshake.start(currentVideoId);
  return true;
}

const playerHandshake = {
  pollTimer: null,
  timeoutTimer: null,
  gotMessage: false,
  start(videoId) {
    this.gotMessage = false;
    clearInterval(this.pollTimer);
    clearTimeout(this.timeoutTimer);
    this.pollTimer = setInterval(() => {
      try {
        ytPlayerEl.contentWindow?.postMessage(
          JSON.stringify({ event: "listening", id: "wla", channel: "widget" }),
          "*"
        );
      } catch (_) {}
    }, 300);
    this.timeoutTimer = setTimeout(() => {
      clearInterval(this.pollTimer);
      if (!this.gotMessage) {
        dbg("ERROR", `Player handshake timed out for ${videoId} — no postMessage events received from embed iframe`);
        showDebugButton();
      }
    }, 6000);
  },
  ack() {
    if (!this.gotMessage) dbg("INFO", "Player handshake established");
    this.gotMessage = true;
    clearInterval(this.pollTimer);
  },
};

window.addEventListener("message", (e) => {
  if (e.origin !== "https://www.youtube-nocookie.com" && e.origin !== "https://www.youtube.com") return;
  let data;
  try { data = JSON.parse(e.data); } catch { return; }
  playerHandshake.ack();

  if (data.event === "onError") {
    clearTimeout(strategyConfirmTimer);
    const code = data.info;
    const meaning = YT_ERROR_MEANINGS[code] ?? "unknown error code";
    dbg("ERROR", `YouTube player error ${code} (${meaning}) for video ${currentVideoId} [strategy ${strategyIndex}]`);
    showDebugButton();

    if (code === 101 || code === 150) {
      // Video-level restriction — no strategy can fix this
      showErrorBanner(`This video has embedding disabled by its owner. Use "Open on YouTube" to watch it.`);
    } else if ((code === 152 || code === 153) && retryEmbed()) {
      // Context-level rejection — silently try the next strategy
    } else {
      showErrorBanner(`YouTube player error ${code}: ${meaning}`);
    }
  } else if (data.event === "onReady") {
    dbg("INFO", `Player ready for ${currentVideoId}`);
    confirmStrategySoon();
  }
});

// ── DOM refs ─────────────────────────────────────────────────────────────────
const loadingState  = document.getElementById("loading-state");
const errorState    = document.getElementById("error-state");
const emptyState    = document.getElementById("empty-state");
const playerView    = document.getElementById("player-view");
const refreshBtn    = document.getElementById("refresh-btn");
const videoCount    = document.getElementById("video-count");
const syncStatus    = document.getElementById("sync-status");

// Player view elements
const ytPlayerEl    = document.getElementById("yt-player");
const queueScroll   = document.getElementById("queue-scroll");
const queueCount    = document.getElementById("queue-count");
const btnRemoveNext = document.getElementById("btn-remove-next");
const btnKeep       = document.getElementById("btn-keep");
const btnOpenYt     = document.getElementById("btn-open-yt");
const infoTitle     = document.getElementById("info-title");
const infoChannel   = document.getElementById("info-channel");
const infoDuration  = document.getElementById("info-duration");

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadSavedStrategy();
  loadPlaylist();

  refreshBtn.addEventListener("click", () => loadPlaylist());
  btnRemoveNext.addEventListener("click", handleRemoveAndNext);
  btnKeep.addEventListener("click", handleKeep);

  const debugBtn = document.getElementById("debug-btn");
  debugBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(await copyDebugInfo());
      debugBtn.textContent = "✓ Copied!";
    } catch (err) {
      debugBtn.textContent = "Copy failed";
      dbg("ERROR", `clipboard write failed: ${err.message}`);
    }
    setTimeout(() => { debugBtn.textContent = "⚠ Copy debug info"; }, 2000);
  });

  // Accordion toggle
  document.querySelectorAll(".acc-header").forEach(header => {
    header.addEventListener("click", () => {
      const body = document.getElementById("acc-" + header.dataset.acc);
      const isOpen = header.classList.contains("open");
      header.classList.toggle("open", !isOpen);
      body.classList.toggle("open", !isOpen);
    });
  });
});

// ── Load / reload playlist ────────────────────────────────────────────────────
async function loadPlaylist() {
  allVideos = [];
  nextContinuation = null;
  currentVideoId = null;
  showState("loading");
  setRefreshing(true);

  try {
    const result = await sendMessage({ type: "fetch_wl" });
    allVideos = result.videos;
    nextContinuation = result.continuation;
    lastSyncTime = new Date();
    updateSyncStatus();
    updateCount(allVideos.length);

    if (allVideos.length === 0) {
      showState("empty");
      return;
    }

    showState("player");
    renderQueue(allVideos, false);
    updateQueueCount();
    appendLoadMoreCard();
    loadVideo(allVideos[0].videoId);
  } catch (err) {
    console.error("[WLA] loadPlaylist:", err);
    showError(err.message ?? String(err));
  } finally {
    setRefreshing(false);
  }
}

// ── Load more (continuation) ──────────────────────────────────────────────────
async function loadMore() {
  if (!nextContinuation) return;

  const btn = document.getElementById("queue-load-more-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Loading…"; }

  try {
    const result = await sendMessage({ type: "fetch_wl", continuation: nextContinuation });
    allVideos = allVideos.concat(result.videos);
    nextContinuation = result.continuation;
    renderQueue(result.videos, true);
    updateCount(allVideos.length);
    updateQueueCount();
    appendLoadMoreCard();
  } catch (err) {
    console.error("[WLA] loadMore:", err);
    showErrorBanner(err.message ?? String(err));
    if (btn) { btn.disabled = false; btn.textContent = "Load more…"; }
  }
}

// ── Video navigation ──────────────────────────────────────────────────────────
function loadVideo(videoId) {
  const video = allVideos.find(v => v.videoId === videoId);
  if (!video) return;

  currentVideoId = videoId;

  // Load video — replacing src stops the previous video immediately.
  // enablejsapi lets us receive player events (incl. errors) via postMessage.
  ytPlayerEl.src = embedSrc(videoId);
  dbg("INFO", `Loading video ${videoId} (${ytPlayerEl.src})`);
  playerHandshake.start(videoId);

  // Info panel
  infoTitle.textContent = video.title ?? "";
  infoChannel.textContent = video.channel ?? "";
  infoDuration.textContent = [video.duration, video.uploadDate].filter(Boolean).join(" · ");

  // Open-on-YT link
  btnOpenYt.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  // Queue active highlight
  document.querySelectorAll(".queue-card").forEach(card => {
    card.classList.toggle("active", card.dataset.videoId === videoId);
  });

  // Scroll active card into view
  const active = queueScroll.querySelector(".queue-card.active");
  if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

  updateActionButtons();
}

function handleKeep() {
  const next = getNextVideo();
  if (next) loadVideo(next.videoId);
}

async function handleRemoveAndNext() {
  if (!currentVideoId) return;

  const video = allVideos.find(v => v.videoId === currentVideoId);
  if (!video) return;

  const nextVideo = getNextVideo(); // capture before removing

  btnRemoveNext.disabled = true;
  btnKeep.disabled = true;
  btnRemoveNext.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" style="animation:spin .6s linear infinite">
      <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
    Removing…`;

  try {
    await sendMessage({
      type: "remove_video",
      videoId: video.videoId,
      setVideoId: video.setVideoId,
      removeEndpoint: video.removeEndpoint ?? null,
    });

    // Remove from state & queue DOM
    allVideos = allVideos.filter(v => v.videoId !== currentVideoId);
    const card = queueScroll.querySelector(`.queue-card[data-video-id="${CSS.escape(currentVideoId)}"]`);
    if (card) card.remove();

    updateCount(allVideos.length);
    updateQueueCount();

    if (allVideos.length === 0) {
      showState("empty");
      return;
    }

    // Go to next; fall back to new last if we removed the last item
    const target = (nextVideo && allVideos.find(v => v.videoId === nextVideo.videoId))
      ? nextVideo.videoId
      : allVideos[allVideos.length - 1].videoId;

    loadVideo(target);
  } catch (err) {
    showErrorBanner(`Could not remove video: ${err.message}`);
  } finally {
    btnRemoveNext.disabled = false;
    btnRemoveNext.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      Remove &amp; Next`;
    updateActionButtons();
  }
}

function getNextVideo() {
  const idx = allVideos.findIndex(v => v.videoId === currentVideoId);
  return idx === -1 ? null : (allVideos[idx + 1] ?? null);
}

function updateActionButtons() {
  const hasNext = !!getNextVideo();
  btnKeep.disabled = !hasNext;
}

// ── Queue rendering ────────────────────────────────────────────────────────────
function renderQueue(videos, append) {
  // Remove the load-more card before appending new cards
  const existing = document.getElementById("queue-load-more-card");
  if (existing) existing.remove();

  const frag = document.createDocumentFragment();
  for (const video of videos) {
    frag.appendChild(buildQueueCard(video));
  }
  queueScroll.appendChild(frag);
}

function buildQueueCard(video) {
  const card = document.createElement("div");
  card.className = "queue-card";
  card.dataset.videoId = video.videoId;

  card.innerHTML = `
    <div class="queue-thumb">
      <img src="${escAttr(video.thumbnail)}" alt="" loading="lazy" />
      ${video.duration ? `<span class="duration-badge">${escHtml(video.duration)}</span>` : ""}
    </div>
    <div class="queue-card-body">
      <div class="queue-card-title">${escHtml(video.title)}</div>
      <div class="queue-card-meta">${escHtml(
        [video.channel, video.uploadDate].filter(Boolean).join(" · ")
      )}</div>
    </div>
  `;

  const img = card.querySelector("img");
  img.addEventListener("error", () => { img.style.display = "none"; });

  card.addEventListener("click", () => loadVideo(video.videoId));
  return card;
}

function appendLoadMoreCard() {
  const existing = document.getElementById("queue-load-more-card");
  if (existing) existing.remove();
  if (!nextContinuation) return;

  const wrap = document.createElement("div");
  wrap.id = "queue-load-more-card";
  wrap.className = "queue-load-more-card";

  const btn = document.createElement("button");
  btn.id = "queue-load-more-btn";
  btn.className = "queue-load-more-btn";
  btn.textContent = "Load more…";
  btn.addEventListener("click", loadMore);

  wrap.appendChild(btn);
  queueScroll.appendChild(wrap);
}

function updateQueueCount() {
  const n = allVideos.length;
  const suffix = nextContinuation ? "+" : "";
  queueCount.textContent = `${n}${suffix} video${n !== 1 ? "s" : ""}`;
}

// ── UI state helpers ──────────────────────────────────────────────────────────
function showState(state) {
  loadingState.hidden = true;
  errorState.hidden   = true;
  emptyState.hidden   = true;
  playerView.hidden   = true;

  if      (state === "loading") loadingState.hidden = false;
  else if (state === "error")   errorState.hidden   = false;
  else if (state === "empty")   emptyState.hidden   = false;
  else if (state === "player")  playerView.hidden   = false;
}

function showError(message) {
  console.error("[WLA] Error:", message);
  showState("error");

  const title  = document.getElementById("error-title");
  const msg    = document.getElementById("error-message");
  const link   = document.getElementById("error-link");
  const detail = document.getElementById("error-detail");

  if (message === "NOT_LOGGED_IN") {
    title.textContent = "Not logged into YouTube";
    msg.textContent   = "Please log into YouTube in this browser, then click Refresh.";
    link.hidden   = false;
    detail.hidden = true;
  } else {
    title.textContent = "Something went wrong";
    msg.textContent   = "An error occurred while loading your Watch Later list.";
    link.hidden        = true;
    detail.textContent = message;
    detail.hidden      = false;
  }
}

function updateCount(n) {
  videoCount.textContent = `${n} video${n !== 1 ? "s" : ""}`;
  videoCount.hidden = false;
}

function updateSyncStatus() {
  if (!lastSyncTime) { syncStatus.textContent = ""; return; }
  syncStatus.textContent = `Synced ${formatRelativeTime(lastSyncTime)}`;
}

function setRefreshing(loading) {
  refreshBtn.disabled = loading;
  if (loading) {
    refreshBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="animation:spin .8s linear infinite">
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      Refreshing…`;
  } else {
    refreshBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      Refresh`;
  }
}

// ── Persistent error banner ────────────────────────────────────────────────────
function showErrorBanner(message) {
  console.error("[WLA] Error banner:", message);

  const existing = document.getElementById("error-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "error-banner";

  const text = document.createElement("pre");
  text.className = "error-banner-text";
  text.textContent = message;

  const actions = document.createElement("div");
  actions.className = "error-banner-actions";

  const copyBtn = document.createElement("button");
  copyBtn.className = "error-banner-btn";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(message).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
    });
  });

  const closeBtn = document.createElement("button");
  closeBtn.className = "error-banner-btn error-banner-close";
  closeBtn.setAttribute("aria-label", "Dismiss");
  closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
  closeBtn.addEventListener("click", () => banner.remove());

  actions.appendChild(copyBtn);
  actions.appendChild(closeBtn);
  banner.appendChild(text);
  banner.appendChild(actions);
  document.body.appendChild(banner);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function sendMessage(msg) {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(msg, (response) => {
      if (browser.runtime.lastError) {
        reject(new Error(browser.runtime.lastError.message));
        return;
      }
      if (!response || !response.ok) {
        reject(new Error(response?.error ?? "Unknown error from background script"));
        return;
      }
      resolve(response);
    });
  });
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(str) { return escHtml(str); }

function formatRelativeTime(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5)  return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

setInterval(updateSyncStatus, 60_000);
