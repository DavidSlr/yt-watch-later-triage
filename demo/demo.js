// demo.js — static, canned-data version of the real extension UI.
// No browser.* extension APIs and no live network calls except fetching
// this page's own videos-data.json and the YouTube embed itself. Rendering
// logic here intentionally mirrors renderAnalysis() etc. in pages/watchlater.js
// so the demo looks and behaves like the real thing — trimmed of the parts
// that only make sense with a live extension (loading/error states, remove/
// keep actions, AI settings, transcript inspection).

let videos = [];
let currentIndex = 0;

const infoTitle = document.getElementById("info-title");
const infoChannel = document.getElementById("info-channel");
const infoVideoDuration = document.getElementById("info-video-duration");
const btnOpenYt = document.getElementById("btn-open-yt");
const ytPlayer = document.getElementById("yt-player");
const videoCount = document.getElementById("video-count");
const queueCount = document.getElementById("queue-count");
const queueScroll = document.getElementById("queue-scroll");

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escAttr(str) { return escHtml(str); }

function aiContent(section) {
  return document.querySelector(`.ai-content[data-section="${section}"]`);
}

function embedSrc(videoId, startSeconds) {
  const params = new URLSearchParams({ rel: "0", fs: "1" });
  if (startSeconds != null) {
    params.set("start", String(Math.floor(startSeconds)));
    params.set("autoplay", "1");
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

// ── Rendering (mirrors renderAnalysis() in pages/watchlater.js) ────────────────
function renderAnalysis(data) {
  const summaryParts = data.summary
    .split(/\n+/)
    .filter(Boolean)
    .map(p => `<p class="summary-p">${escHtml(p)}</p>`)
    .join("");
  const clickbaitBlock = data.clickbait
    ? `<div class="clickbait-answer"><span class="clickbait-label">Click-bait answer</span>${escHtml(data.clickbait)}</div>`
    : "";
  aiContent("summary").innerHTML = summaryParts + clickbaitBlock;

  if (!data.takeaways || !data.takeaways.length) {
    aiContent("takeaways").innerHTML = `<p class="placeholder-note">No key takeaways identified.</p>`;
  } else {
    const items = data.takeaways.map(t => {
      const tsAttr = (t.ts != null) ? ` ts="${t.ts}"` : "";
      const labelAttr = t.label ? ` label="${escAttr(t.label)}"` : "";
      return `<wla-takeaway${tsAttr} point="${escAttr(t.point)}"${labelAttr}></wla-takeaway>`;
    }).join("");
    aiContent("takeaways").innerHTML = `<div class="takeaways-list">${items}</div>`;
  }

  const chip = t => `<span class="ai-chip">${escHtml(t)}</span>`;
  aiContent("tags").innerHTML = `
    <div class="ai-chips">
      <div class="ai-chip-group-label">Watch context</div>
      ${data.tags.context.map(chip).join("") || `<span class="placeholder-note">none</span>`}
      <div class="ai-chip-group-label">Content type</div>
      ${data.tags.type.map(chip).join("") || `<span class="placeholder-note">none</span>`}
    </div>`;

  const s = data.sentiment;
  if (!s) {
    aiContent("sentiment").innerHTML = `<p class="placeholder-note">No comments available for this video.</p>`;
    return;
  }
  const themes = (s.themes ?? []).map(t => {
    const sign = t.tone === "positive"
      ? `<span class="theme-sign theme-sign-pos">+</span>`
      : `<span class="theme-sign theme-sign-neg">&#8722;</span>`;
    return `
    <div class="theme-item ${t.tone}">
      <span class="theme-title">${sign}${escHtml(t.theme)}</span>
      ${t.quote ? `<span class="theme-quote">"${escHtml(t.quote)}"</span>` : ""}
    </div>`;
  }).join("");
  aiContent("sentiment").innerHTML = `
    <div class="sentiment-mini">
      <div class="seg-pos" style="width:${Number(s.positive) || 0}%"></div>
      <div class="seg-neu" style="width:${Number(s.neutral) || 0}%"></div>
      <div class="seg-neg" style="width:${Number(s.critical) || 0}%"></div>
    </div>
    <div class="sentiment-legend">${Number(s.positive) || 0}% positive · ${Number(s.neutral) || 0}% neutral · ${Number(s.critical) || 0}% critical</div>
    <div class="theme-list">${themes || `<p class="placeholder-note">No clear themes found.</p>`}</div>`;
}

// ── Queue ───────────────────────────────────────────────────────────────────
function buildQueueCard(video, index) {
  const card = document.createElement("wla-queue-card");
  card.dataset.index = String(index);
  card.thumbnail = video.thumbnail ?? "";
  card.title     = video.title ?? "";
  card.channel   = video.channel ?? "";
  card.duration  = video.duration ?? "";
  card.date      = video.uploadDate ?? "";
  card.addEventListener("wla-select", () => selectVideo(index));
  card.addEventListener("wla-remove", () => flashDemoWarning());
  return card;
}

// scrollIntoView is skipped on the initial load call — the first card is
// already fully visible then, and calling it anyway was scrolling the
// whole (overflow:hidden) body a few pixels on page load, cropping the
// header. Only scroll it into view in response to an actual user pick.
function selectVideo(index, { scrollQueueIntoView = true } = {}) {
  const video = videos[index];
  if (!video) return;
  currentIndex = index;

  ytPlayer.src = embedSrc(video.videoId);
  infoTitle.textContent = video.title ?? "";
  infoChannel.textContent = video.channel ?? "";
  infoVideoDuration.textContent = video.duration ?? "";
  btnOpenYt.href = `https://www.youtube.com/watch?v=${video.videoId}`;

  queueScroll.querySelectorAll("wla-queue-card").forEach(card => {
    card.active = Number(card.dataset.index) === index;
  });
  if (scrollQueueIntoView) {
    queueScroll.querySelector(`wla-queue-card[data-index="${index}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }

  renderAnalysis(video.analysis);
}

// Remove & Next / Keep have no real "remove" or "keep" target in a static
// demo — there's nothing to mutate — but advancing to the next queue item
// (wrapping from last back to first) is a real, useful thing they can still
// do here, so that part stays functional. The warning chip flashes either
// way, as a reminder that no actual list change happened.
function selectNextVideo() {
  if (!videos.length) return;
  selectVideo((currentIndex + 1) % videos.length);
}

function flashDemoWarning() {
  const chip = document.getElementById("demo-warning-chip");
  chip.classList.remove("flash");
  // Force reflow so re-adding the class restarts the animation even on
  // rapid repeat clicks.
  void chip.offsetWidth;
  chip.classList.add("flash");
}

function seekPlayerTo(seconds) {
  const video = videos[currentIndex];
  if (!video) return;
  ytPlayer.src = embedSrc(video.videoId, seconds);
}

// ── Boot ────────────────────────────────────────────────────────────────────
async function init() {
  const res = await fetch("videos-data.json");
  videos = await res.json();

  const n = videos.length;
  videoCount.value = `${n} video${n !== 1 ? "s" : ""}`;
  videoCount.hidden = false;
  queueCount.textContent = `${n} video${n !== 1 ? "s" : ""}`;

  videos.forEach((v, i) => queueScroll.appendChild(buildQueueCard(v, i)));

  aiContent("takeaways").addEventListener("wla-seek", e => seekPlayerTo(e.detail.seconds));

  document.getElementById("btn-remove-next").addEventListener("click", () => {
    flashDemoWarning();
    selectNextVideo();
  });
  document.getElementById("btn-keep").addEventListener("click", () => {
    selectNextVideo();
  });

  // Queue collapse toggle — same click/keydown guard as the real app, so
  // clicking Refresh/prev/next (were they present) wouldn't also collapse it.
  const queueSection = document.getElementById("queue-section");
  const queueCollapseToggle = document.getElementById("queue-collapse-toggle");
  const toggleQueueCollapse = () => {
    const collapsed = queueSection.classList.toggle("collapsed");
    queueCollapseToggle.setAttribute("aria-expanded", String(!collapsed));
  };
  queueCollapseToggle.addEventListener("click", (e) => {
    if (e.target.closest("wla-button, button, a")) return;
    toggleQueueCollapse();
  });
  queueCollapseToggle.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && !e.target.closest("wla-button, button, a")) {
      e.preventDefault();
      toggleQueueCollapse();
    }
  });

  // Queue scroll nav
  const queuePrev = document.getElementById("queue-prev");
  const queueNext = document.getElementById("queue-next");
  const scrollQueue = (dir) => {
    queueScroll.scrollBy({ left: dir * Math.max(queueScroll.clientWidth * 0.8, 200), behavior: "smooth" });
  };
  queuePrev.addEventListener("click", () => scrollQueue(-1));
  queueNext.addEventListener("click", () => scrollQueue(1));

  if (videos.length) selectVideo(0, { scrollQueueIntoView: false });
}

init();
