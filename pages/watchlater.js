// State
let allVideos = [];
let nextContinuation = null;
let lastSyncTime = null;

// DOM refs
const grid = document.getElementById("video-grid");
const errorState = document.getElementById("error-state");
const emptyState = document.getElementById("empty-state");
const refreshBtn = document.getElementById("refresh-btn");
const loadMoreContainer = document.getElementById("load-more-container");
const loadMoreBtn = document.getElementById("load-more-btn");
const videoCount = document.getElementById("video-count");
const syncStatus = document.getElementById("sync-status");

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadPlaylist();

  refreshBtn.addEventListener("click", () => loadPlaylist());
  loadMoreBtn.addEventListener("click", () => loadMore());
});

// ---------------------------------------------------------------------------
// Load / reload the full playlist
// ---------------------------------------------------------------------------
async function loadPlaylist() {
  allVideos = [];
  nextContinuation = null;
  showState("loading");
  setRefreshing(true);

  try {
    const result = await sendMessage({ type: "fetch_wl" });
    allVideos = result.videos;
    nextContinuation = result.continuation;
    renderVideos(allVideos, /* append= */ false);
    updateCount(allVideos.length);
    updateLoadMore();
    lastSyncTime = new Date();
    updateSyncStatus();

    if (allVideos.length === 0) {
      showState("empty");
    } else {
      showState("grid");
    }
  } catch (err) {
    console.error("[YT Watch Later Triage] loadPlaylist failed:", err);
    showError(err.message ?? String(err));
  } finally {
    setRefreshing(false);
  }
}

// ---------------------------------------------------------------------------
// Load next page (continuation)
// ---------------------------------------------------------------------------
async function loadMore() {
  if (!nextContinuation) return;
  loadMoreBtn.disabled = true;
  loadMoreBtn.textContent = "Loading…";

  try {
    const result = await sendMessage({ type: "fetch_wl", continuation: nextContinuation });
    allVideos = allVideos.concat(result.videos);
    nextContinuation = result.continuation;
    renderVideos(result.videos, /* append= */ true);
    updateCount(allVideos.length);
    updateLoadMore();
  } catch (err) {
    console.error("[YT Watch Later Triage] loadMore failed:", err);
    showError(err.message ?? String(err));
  } finally {
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Load more videos";
  }
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------
function renderVideos(videos, append) {
  if (!append) {
    grid.innerHTML = "";
  }

  const fragment = document.createDocumentFragment();
  for (const video of videos) {
    fragment.appendChild(buildCard(video));
  }
  grid.appendChild(fragment);
}

function buildCard(video) {
  const card = document.createElement("article");
  card.className = "video-card";
  card.dataset.videoId = video.videoId;
  card.dataset.setVideoId = video.setVideoId;
  card._video = video; // keep the full video object (incl. removeEndpoint)

  const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;

  card.innerHTML = `
    <a class="thumb-wrap" href="${videoUrl}" target="_blank" rel="noopener" title="${escHtml(video.title)}">
      <img src="${escAttr(video.thumbnail)}" alt="" loading="lazy" class="loading" />
      ${video.duration ? `<span class="duration-badge">${escHtml(video.duration)}</span>` : ""}
    </a>
    <div class="card-body">
      <a class="card-title" href="${videoUrl}" target="_blank" rel="noopener">${escHtml(video.title)}</a>
      ${video.channel ? `<div class="card-channel">${escHtml(video.channel)}</div>` : ""}
      <div class="card-meta">
        ${video.uploadDate ? `<span>${escHtml(video.uploadDate)}</span>` : ""}
      </div>
      ${video.description ? `<div class="card-description">${escHtml(video.description)}</div>` : ""}
    </div>
    <div class="card-footer">
      <button class="btn-remove" title="Remove from Watch Later">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        Remove
      </button>
    </div>
  `;

  // Wire up img load/error via addEventListener — inline handlers violate extension CSP
  const img = card.querySelector("img");
  img.addEventListener("load", () => img.classList.remove("loading"));
  img.addEventListener("error", () => {
    img.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>";
    img.classList.remove("loading");
  });

  card.querySelector(".btn-remove").addEventListener("click", () => handleRemove(card));
  return card;
}

function buildSkeletonCards(count = 12) {
  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "skeleton-card";
    el.innerHTML = `
      <div class="skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-full"></div>
        <div class="skeleton-line w-3-4"></div>
        <div class="skeleton-line w-1-2"></div>
      </div>
    `;
    grid.appendChild(el);
  }
}

// ---------------------------------------------------------------------------
// Remove a video
// ---------------------------------------------------------------------------
async function handleRemove(card) {
  const video = card._video ?? {};
  const videoId = card.dataset.videoId;
  const setVideoId = card.dataset.setVideoId;
  const removeEndpoint = video.removeEndpoint ?? null;
  const btn = card.querySelector(".btn-remove");

  btn.disabled = true;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="animation:spin .6s linear infinite">
      <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
    Removing…
  `;

  try {
    await sendMessage({ type: "remove_video", videoId, setVideoId, removeEndpoint });
    card.classList.add("removing");
    card.addEventListener("animationend", () => {
      card.remove();
      allVideos = allVideos.filter((v) => v.videoId !== videoId);
      updateCount(allVideos.length);
      if (allVideos.length === 0 && !nextContinuation) showState("empty");
    }, { once: true });
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      Remove
    `;
    showErrorBanner(`Could not remove video: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// UI state helpers
// ---------------------------------------------------------------------------
function showState(state) {
  errorState.hidden = true;
  emptyState.hidden = true;
  grid.hidden = true;

  if (state === "loading") {
    buildSkeletonCards();
    grid.hidden = false;
  } else if (state === "error") {
    errorState.hidden = false;
  } else if (state === "empty") {
    emptyState.hidden = false;
  } else if (state === "grid") {
    grid.hidden = false;
  }
}

function showError(message) {
  console.error("[YT Watch Later Triage] Error:", message);
  showState("error");
  const title = document.getElementById("error-title");
  const msg = document.getElementById("error-message");
  const link = document.getElementById("error-link");
  const detail = document.getElementById("error-detail");

  if (message === "NOT_LOGGED_IN") {
    title.textContent = "Not logged into YouTube";
    msg.textContent = "Please log into YouTube in this browser, then click Refresh.";
    link.hidden = false;
    detail.hidden = true;
  } else {
    title.textContent = "Something went wrong";
    msg.textContent = "An error occurred while loading your Watch Later list.";
    link.hidden = true;
    detail.textContent = message;
    detail.hidden = false;
  }
}

function updateCount(n) {
  videoCount.textContent = `${n} video${n !== 1 ? "s" : ""}`;
  videoCount.hidden = false;
}

function updateLoadMore() {
  loadMoreContainer.hidden = !nextContinuation;
}

function updateSyncStatus() {
  if (!lastSyncTime) { syncStatus.textContent = ""; return; }
  syncStatus.textContent = `Last synced ${formatRelativeTime(lastSyncTime)}`;
}

function setRefreshing(loading) {
  refreshBtn.disabled = loading;
  if (loading) {
    refreshBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="animation:spin .8s linear infinite">
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      Refreshing…
    `;
  } else {
    refreshBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      Refresh
    `;
  }
}

// ---------------------------------------------------------------------------
// Persistent error banner (stays until dismissed)
// ---------------------------------------------------------------------------
function showErrorBanner(message) {
  console.error("[YT Watch Later Triage] Remove error:", message);

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

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
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

function escAttr(str) {
  return escHtml(str);
}

function formatRelativeTime(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// Tick sync status every minute
setInterval(updateSyncStatus, 60_000);
