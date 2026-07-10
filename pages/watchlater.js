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

function seekPlayerTo(seconds) {
  const win = ytPlayerEl.contentWindow;
  if (!win) return;
  win.postMessage(JSON.stringify({ event: "command", func: "seekTo",    args: [seconds, true] }), "*");
  win.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }),               "*");
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
      showErrorBanner(`This video has embedding disabled by its owner. Use "Open" to watch it on YouTube.`);
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

// ── AI analysis ───────────────────────────────────────────────────────────────
const ANALYSIS_CACHE_MAX = 200;
let analysisInFlightFor = null;

async function ensureAnalysis(videoId, force = false) {
  if (!(await WLA_AI.isConfigured())) { setAiPanelsNoKey(); return; }

  if (!force) {
    const cached = await getCachedAnalysis(videoId);
    if (cached) {
      renderAnalysis(cached.data);
      setAiStatus(`Generated ${formatRelativeTime(new Date(cached.ts))}`, { refresh: videoId });
      showInspectBtn(videoId);
      return;
    }
  }

  if (analysisInFlightFor === videoId) return;
  analysisInFlightFor = videoId;
  setAiStatus("Analyzing…");
  setAiPanelsLoading();

  try {
    const video = allVideos.find(v => v.videoId === videoId);
    if (!video) throw new Error("Video no longer in list");

    // Transcript and comments are both best-effort; fetch in parallel
    let comments = [];
    let transcript = null;
    let transcriptStatus = null; // "ok" | "none" | "offline"
    let transcriptError = null;

    const { aiSettings } = await browser.storage.local.get("aiSettings");
    const harvesterUrl = aiSettings?.harvesterUrl || "http://localhost:47823";

    await Promise.allSettled([
      sendMessage({ type: "fetch_comments", videoId, limit: 30 }).then(r => {
        comments = r.comments ?? [];
        if (r.error) dbg("WARN", `Comments unavailable for ${videoId}: ${r.error}`);
      }).catch(e => dbg("WARN", `Comment fetch failed for ${videoId}: ${e.message}`)),

      (async () => {
        // Check transcript cache first — "ok" and "none" are stable, never re-fetch.
        const cached = await getCachedTranscript(videoId);
        if (cached && (cached.status === "ok" || cached.status === "none")) {
          transcript = cached.transcript;
          transcriptStatus = cached.status;
          dbg("INFO", `Transcript cache hit for ${videoId}: ${cached.status}`);
          return;
        }
        try {
          const r = await sendMessage({ type: "fetch_transcript", videoId, harvesterUrl });
          transcript = r.transcript ?? null;
          transcriptStatus = r.status ?? (transcript ? "ok" : "offline");
          if (r.error) {
            transcriptError = r.error;
            dbg("WARN", `Transcript unavailable for ${videoId} (${transcriptStatus}): ${r.error}`);
          }
          await setCachedTranscript(videoId, { transcript, status: transcriptStatus });
        } catch (e) {
          transcriptStatus = "offline";
          transcriptError = e.message;
          dbg("WARN", `Transcript fetch failed for ${videoId}: ${e.message}`);
        }
      })(),
    ]);
    dbg("INFO", `Analyzing ${videoId} — transcript: ${transcript ? `${transcript.length} chars (${transcriptStatus})` : `none (status=${transcriptStatus ?? "?"}, ${transcriptError ?? "no tracks"})`}, comments: ${comments.length}`);

    // Build and persist the prompt + transcript BEFORE calling the AI so the
    // inspect modal works even if the AI call fails.
    const builtPrompt = WLA_PROMPTS.buildPrompt(video, comments, transcript);
    await setCachedDebugInfo(videoId, { transcript, transcriptStatus, transcriptError, prompt: builtPrompt });
    if (currentVideoId === videoId) showInspectBtn(videoId);

    const data = await WLA_AI.analyze(video, comments, transcript);
    await setCachedAnalysis(videoId, data);
    dbg("INFO", `Analysis complete for ${videoId}`);

    // Don't clobber the panels if the user has moved on to another video
    if (currentVideoId === videoId) {
      renderAnalysis(data, transcriptStatus);
      setAiStatus("Generated just now", { refresh: videoId });
    }
  } catch (err) {
    dbg("ERROR", `AI analysis failed for ${videoId}: ${err.message}`);
    if (currentVideoId === videoId) {
      if (err.message === "NO_API_KEY") {
        setAiPanelsNoKey();
      } else {
        setAiStatus(`Analysis failed: ${err.message}`, { error: true, refresh: videoId });
      }
    }
  } finally {
    if (analysisInFlightFor === videoId) analysisInFlightFor = null;
  }
}

// ── Debug info cache (transcript + prompt, unbounded) ─────────────────────────
async function getCachedDebugInfo(videoId) {
  const key = `debug:${videoId}`;
  const obj = await browser.storage.local.get(key);
  return obj[key] ?? null;
}

async function setCachedDebugInfo(videoId, info) {
  await browser.storage.local.set({ [`debug:${videoId}`]: info });
}

// ── Transcript cache (storage.local, persistent) ─────────────────────────────
// Keyed by `transcript:${videoId}`. Stores { transcript, status, fetchedAt }.
// "ok" and "none" are stable facts → always reuse. "offline" is transient →
// never cache so the harvester is retried once it's back up.
async function getCachedTranscript(videoId) {
  const key = `transcript:${videoId}`;
  const obj = await browser.storage.local.get(key);
  return obj[key] ?? null;
}

async function setCachedTranscript(videoId, { transcript, status }) {
  if (status === "offline") return; // don't persist transient failures
  await browser.storage.local.set({
    [`transcript:${videoId}`]: { transcript, status, fetchedAt: Date.now() },
  });
}

// ── Analysis cache (storage.local, bounded) ───────────────────────────────────
async function getCachedAnalysis(videoId) {
  const key = `analysis:${videoId}`;
  const obj = await browser.storage.local.get(key);
  return obj[key] ?? null;
}

async function setCachedAnalysis(videoId, data) {
  const settings = await WLA_AI.getSettings();
  await browser.storage.local.set({
    [`analysis:${videoId}`]: { data, ts: Date.now(), provider: settings.provider, model: settings.model },
  });

  const { analysisIndex = [] } = await browser.storage.local.get("analysisIndex");
  const idx = analysisIndex.filter(id => id !== videoId);
  idx.push(videoId);
  while (idx.length > ANALYSIS_CACHE_MAX) {
    const evict = idx.shift();
    await browser.storage.local.remove(`analysis:${evict}`);
  }
  await browser.storage.local.set({ analysisIndex: idx });
}

// ── AI panel rendering ────────────────────────────────────────────────────────
function aiContent(section) {
  return document.querySelector(`.ai-content[data-section="${section}"]`);
}

function setAiStatus(text, opts = {}) {
  document.querySelectorAll(".ai-status").forEach(el => {
    el.classList.toggle("error", !!opts.error);
    el.innerHTML = "";
    if (!text) return;
    const span = document.createElement("span");
    span.textContent = text;
    el.appendChild(span);
    if (opts.refresh) {
      const btn = document.createElement("button");
      btn.className = "ai-refresh";
      btn.textContent = "↻ Refresh";
      btn.title = "Re-run the AI analysis for this video";
      btn.addEventListener("click", () => ensureAnalysis(opts.refresh, true));
      el.appendChild(btn);
    }
  });
}

function setAiPanelsNoKey() {
  setAiStatus("");
  for (const [section, label] of [
    ["summary",   "Generate a summary"],
    ["takeaways", "Extract key takeaways"],
    ["sentiment", "Analyze comment sentiment"],
    ["tags",      "Tag this video"],
  ]) {
    const btn = document.createElement("button");
    btn.className = "btn-setup-ai";
    btn.textContent = "Set up AI…";
    btn.title = label;
    btn.addEventListener("click", () => document.getElementById("settings-btn").click());
    const wrap = aiContent(section);
    wrap.innerHTML = "";
    wrap.appendChild(btn);
  }
}

// ── Inspect modal (transcript + AI prompt viewer) ─────────────────────────────
const inspectModal = document.getElementById("inspect-modal");

inspectModal.addEventListener("wla-close", () => { inspectModal.open = false; });

document.getElementById("inspect-copy").addEventListener("click", () => {
  const inspectTabs = document.getElementById("inspect-tabs");
  const activeSlot  = inspectTabs?.active ?? "transcript";
  const pre = inspectModal.querySelector(`[slot="${activeSlot}"] pre`);
  navigator.clipboard.writeText(pre?.textContent ?? "").then(() => {
    const btn = document.getElementById("inspect-copy");
    const prev = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = prev; }, 1500);
  });
});

function showInspectBtn(videoId) {
  const menuBtn = document.getElementById("video-menu-btn");
  const inspectItem = document.getElementById("video-menu-inspect");
  if (!menuBtn || !inspectItem) return;
  menuBtn.hidden = false;
  inspectItem.onclick = () => openInspectModal(videoId);
}

async function openInspectModal(videoId) {
  const info = await getCachedDebugInfo(videoId);
  const transcriptEl = document.getElementById("inspect-transcript");
  if (info?.transcript) {
    transcriptEl.textContent = info.transcript;
    transcriptEl.className = "";
  } else {
    let reason;
    if (info?.transcriptStatus === "none") {
      reason = "No transcript available for this video.";
    } else if (info?.transcriptStatus === "offline") {
      reason = `Transcript service offline — start the harvester to enable transcripts.${info.transcriptError ? `\n\nError: ${info.transcriptError}` : ""}`;
    } else if (info?.transcriptError) {
      reason = `FETCH FAILED: ${info.transcriptError}`;
    } else {
      reason = "(video has no captions / transcript was not available)";
    }
    transcriptEl.textContent = reason;
    transcriptEl.className = "inspect-error";
  }
  document.getElementById("inspect-prompt").textContent =
    info?.prompt ?? "(prompt not cached — run analysis first)";

  const inspectTabs = document.getElementById("inspect-tabs");
  if (inspectTabs) inspectTabs.active = "transcript";

  inspectModal.open = true;
}

function setAiPanelsLoading() {
  for (const s of ["summary", "takeaways", "sentiment", "tags"]) {
    aiContent(s).innerHTML = `<p class="placeholder-note">Analyzing…</p>`;
  }
}

function renderAnalysis(data, transcriptStatus) {
  // Summary — paragraphs, optional no-transcript note, optional clickbait answer
  const summaryParts = data.summary
    .split(/\n+/)
    .filter(Boolean)
    .map(p => `<p class="summary-p">${escHtml(p)}</p>`)
    .join("");
  let noTranscriptNote = "";
  if (data.takeaways === null) {
    if (transcriptStatus === "offline") {
      noTranscriptNote = `<p class="no-transcript-note transcript-offline">Transcript service offline — summary based on metadata only</p>`;
    } else {
      noTranscriptNote = `<p class="no-transcript-note">No transcript available — summary based on metadata only</p>`;
    }
  }
  const clickbaitBlock = data.clickbait
    ? `<div class="clickbait-answer"><span class="clickbait-label">Click-bait answer</span>${escHtml(data.clickbait)}</div>`
    : "";
  aiContent("summary").innerHTML = summaryParts + noTranscriptNote + clickbaitBlock;

  // Key takeaways
  if (!data.takeaways) {
    aiContent("takeaways").innerHTML = `<p class="placeholder-note">No transcript available for this video.</p>`;
  } else {
    const items = data.takeaways.map(t => {
      const tsAttr    = (t.ts != null) ? ` ts="${t.ts}"` : "";
      const labelAttr = t.label ? ` label="${escAttr(t.label)}"` : "";
      return `<wla-takeaway${tsAttr} point="${escAttr(t.point)}"${labelAttr}></wla-takeaway>`;
    }).join("");
    aiContent("takeaways").innerHTML = `<div class="takeaways-list">${items || `<p class="placeholder-note">No key takeaways identified.</p>`}</div>`;
  }

  // Tags
  const chip = t => `<span class="ai-chip">${escHtml(t)}</span>`;
  aiContent("tags").innerHTML = `
    <div class="ai-chips">
      <div class="ai-chip-group-label">Watch context</div>
      ${data.tags.context.map(chip).join("") || `<span class="placeholder-note">none</span>`}
      <div class="ai-chip-group-label">Content type</div>
      ${data.tags.type.map(chip).join("") || `<span class="placeholder-note">none</span>`}
    </div>`;

  // Sentiment: brief headline bar + legend, then the themes
  const s = data.sentiment;
  if (!s) {
    aiContent("sentiment").innerHTML = `<p class="placeholder-note">No comments available for this video.</p>`;
    return;
  }
  const themes = (s.themes ?? []).map(t => {
    const sign = t.tone === 'positive'
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

// ── AI settings UI ────────────────────────────────────────────────────────────
async function initAiUi() {
  const modal          = document.getElementById("settings-modal");
  const keyInput       = document.getElementById("ai-key");
  const modelInput     = document.getElementById("ai-model");
  const harvesterInput = document.getElementById("harvester-url");
  const testResult     = document.getElementById("ai-test-result");

  // In-memory per-provider state so switching radio doesn't lose typed values
  const perProvider = {
    gemini: { apiKey: "", model: "" },
    claude:  { apiKey: "", model: "" },
  };
  let activeProvider = "gemini";

  function flushForm() {
    perProvider[activeProvider] = { apiKey: keyInput.value, model: modelInput.value.trim() };
  }

  function restoreForm(provider) {
    const s = perProvider[provider];
    keyInput.value   = s.apiKey;
    modelInput.value = s.model;
    updateProviderUi(provider);
  }

  function updateProviderUi(provider) {
    document.getElementById("provider-config-label").textContent =
      provider === "gemini" ? "Google Gemini" : "Anthropic Claude";
    modelInput.placeholder = WLA_AI.DEFAULTS[provider].model;
    document.getElementById("ai-key-hint").innerHTML = provider === "gemini"
      ? `Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com</a> — no credit card needed (~250 requests/day).`
      : `Get a key at <a href="https://console.anthropic.com/" target="_blank" rel="noopener">console.anthropic.com</a> — pay as you go (Haiku ≈ $0.001–0.01 per video).`;
  }

  async function openModal() {
    const all = await WLA_AI.getAllProviderSettings();
    perProvider.gemini = { apiKey: all.gemini.apiKey, model: all.gemini.model };
    perProvider.claude  = { apiKey: all.claude.apiKey,  model: all.claude.model  };
    activeProvider = all.provider;
    document.querySelectorAll('wla-radio-card[name="ai-provider"]').forEach(card => {
      card.checked = card.value === activeProvider;
    });
    restoreForm(activeProvider);
    const { aiSettings } = await browser.storage.local.get("aiSettings");
    harvesterInput.value = aiSettings?.harvesterUrl || "";
    testResult.hidden = true;
    modal.open = true;
  }

  const closeModal = () => { modal.open = false; };

  function allSettings() {
    flushForm();
    return {
      provider: activeProvider,
      gemini: { ...perProvider.gemini },
      claude: { ...perProvider.claude },
      harvesterUrl: harvesterInput.value.trim() || "http://localhost:47823",
    };
  }

  document.querySelectorAll('wla-radio-card[name="ai-provider"]').forEach(card => {
    card.addEventListener("wla-change", e => {
      flushForm();
      activeProvider = e.detail.value;
      restoreForm(activeProvider);
    });
  });

  document.getElementById("settings-btn").addEventListener("click", openModal);
  modal.addEventListener("wla-close", closeModal);

  document.getElementById("ai-save").addEventListener("click", async () => {
    await WLA_AI.saveAllProviderSettings(allSettings());
    dbg("INFO", `AI settings saved (provider: ${activeProvider})`);
    closeModal();
    if (currentVideoId) ensureAnalysis(currentVideoId);
  });

  document.getElementById("ai-test").addEventListener("click", async () => {
    await WLA_AI.saveAllProviderSettings(allSettings());
    testResult.hidden = false;
    testResult.className = "form-test-result";
    testResult.textContent = "Testing…";
    try {
      await WLA_AI.test();
      testResult.classList.add("ok");
      testResult.textContent = "✓ Connection works";
    } catch (err) {
      testResult.classList.add("err");
      testResult.textContent = `✗ ${err.message}`;
      dbg("ERROR", `AI settings test failed: ${err.message}`);
    }
  });
}

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
const queuePrev     = document.getElementById("queue-prev");
const queueNext     = document.getElementById("queue-next");
const btnRemoveNext = document.getElementById("btn-remove-next");
const btnKeep       = document.getElementById("btn-keep");
const btnOpenYt     = document.getElementById("btn-open-yt");
const infoTitle     = document.getElementById("info-title");
const infoChannel   = document.getElementById("info-channel");
const infoVideoDuration = document.getElementById("info-video-duration");
const infoUploaded  = document.getElementById("info-uploaded");

// ── Harvester health ping ─────────────────────────────────────────────────────
async function pingHarvester() {
  const { aiSettings } = await browser.storage.local.get("aiSettings");
  const base = (aiSettings?.harvesterUrl || "http://localhost:47823").replace(/\/$/, "");
  const el = document.getElementById("harvester-status");
  if (!el) return;
  try {
    const resp = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) });
    if (resp.ok) {
      el.textContent = "transcripts: online";
      el.dataset.state = "online";
    } else {
      el.textContent = "transcripts: error";
      el.dataset.state = "error";
    }
  } catch (_) {
    el.textContent = "transcripts: offline";
    el.dataset.state = "offline";
  }
  el.hidden = false;
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadSavedStrategy();
  initAiUi();
  loadPlaylist();
  pingHarvester();

  refreshBtn.addEventListener("click", () => loadPlaylist());
  btnRemoveNext.addEventListener("click", handleRemoveAndNext);
  btnKeep.addEventListener("click", handleKeep);

  const scrollQueue = (dir) => {
    queueScroll.scrollBy({ left: dir * Math.max(queueScroll.clientWidth * 0.8, 200), behavior: "smooth" });
  };
  queuePrev.addEventListener("click", () => scrollQueue(-1));
  queueNext.addEventListener("click", () => scrollQueue(1));

  const queueSection = document.getElementById("queue-section");
  const queueCollapseToggle = document.getElementById("queue-collapse-toggle");
  if (localStorage.getItem("queue-collapsed") === "true") {
    queueSection.classList.add("collapsed");
    queueCollapseToggle.setAttribute("aria-expanded", "false");
  }
  const toggleQueueCollapse = () => {
    const collapsed = queueSection.classList.toggle("collapsed");
    queueCollapseToggle.setAttribute("aria-expanded", String(!collapsed));
    localStorage.setItem("queue-collapsed", String(collapsed));
  };
  // Clicking anywhere in the bar toggles collapse, except on its own
  // interactive children (Refresh, prev/next) which handle their own clicks.
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

  // Seek the player when a wla-takeaway timestamp is clicked
  aiContent("takeaways").addEventListener("wla-seek", e => {
    seekPlayerTo(e.detail.seconds);
  });

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

  // Set up inspect tabs (wla-tabs requires tabs property set as JS object)
  const inspectTabs = document.getElementById("inspect-tabs");
  if (inspectTabs) {
    inspectTabs.tabs = [
      { id: "transcript", label: "Transcript" },
      { id: "prompt",     label: "AI Prompt"  },
    ];
  }
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
  const menuBtn = document.getElementById("video-menu-btn");
  if (menuBtn) { menuBtn.hidden = true; menuBtn.open = false; }

  // Load video — replacing src stops the previous video immediately.
  // enablejsapi lets us receive player events (incl. errors) via postMessage.
  ytPlayerEl.src = embedSrc(videoId);
  dbg("INFO", `Loading video ${videoId} (${ytPlayerEl.src})`);
  playerHandshake.start(videoId);

  // Info panel
  infoTitle.textContent = video.title ?? "";
  infoChannel.textContent = video.channel ?? "";
  infoVideoDuration.textContent = video.duration ?? "";
  infoUploaded.textContent = video.uploadDate ?? "";

  // Open-on-YT link
  btnOpenYt.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  // Queue active highlight
  queueScroll.querySelectorAll("wla-queue-card").forEach(card => {
    card.active = card.dataset.videoId === videoId;
  });

  // Scroll active card into view
  const active = queueScroll.querySelector("wla-queue-card[active]");
  if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

  updateActionButtons();

  // Kick off AI analysis (cached per video; no-op if not configured)
  ensureAnalysis(videoId);
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
  btnRemoveNext.textContent = "Removing…";

  try {
    await sendMessage({
      type: "remove_video",
      videoId: video.videoId,
      setVideoId: video.setVideoId,
      removeEndpoint: video.removeEndpoint ?? null,
    });

    // Remove from state & queue DOM
    allVideos = allVideos.filter(v => v.videoId !== currentVideoId);
    const card = queueScroll.querySelector(`wla-queue-card[data-video-id="${CSS.escape(currentVideoId)}"]`);
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
    btnRemoveNext.textContent = "Remove & Next";
    updateActionButtons();
  }
}

function getNextVideo() {
  const idx = allVideos.findIndex(v => v.videoId === currentVideoId);
  return idx === -1 ? null : (allVideos[idx + 1] ?? null);
}

async function removeVideoById(videoId) {
  const video = allVideos.find(v => v.videoId === videoId);
  if (!video) return;

  const wasActive = videoId === currentVideoId;
  const nextVideo = wasActive ? getNextVideo() : null;

  try {
    await sendMessage({
      type: "remove_video",
      videoId: video.videoId,
      setVideoId: video.setVideoId,
      removeEndpoint: video.removeEndpoint ?? null,
    });

    allVideos = allVideos.filter(v => v.videoId !== videoId);
    const card = queueScroll.querySelector(`wla-queue-card[data-video-id="${CSS.escape(videoId)}"]`);
    if (card) card.remove();

    updateCount(allVideos.length);
    updateQueueCount();

    if (allVideos.length === 0) { showState("empty"); return; }

    if (wasActive) {
      const target = (nextVideo && allVideos.find(v => v.videoId === nextVideo.videoId))
        ? nextVideo.videoId
        : allVideos[allVideos.length - 1].videoId;
      loadVideo(target);
    }
  } catch (err) {
    showErrorBanner(`Could not remove video: ${err.message}`);
  }
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
  const card = document.createElement("wla-queue-card");
  card.dataset.videoId = video.videoId;
  card.thumbnail = video.thumbnail ?? "";
  card.title     = video.title ?? "";
  card.channel   = video.channel ?? "";
  card.duration  = video.duration ?? "";
  card.date      = video.uploadDate ?? "";

  card.addEventListener("wla-select", () => loadVideo(video.videoId));
  card.addEventListener("wla-remove", () => removeVideoById(video.videoId));

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
  videoCount.value  = `${n} video${n !== 1 ? "s" : ""}`;
  videoCount.hidden = false;
}

function updateSyncStatus() {
  if (!lastSyncTime) { syncStatus.textContent = ""; return; }
  syncStatus.textContent = `Synced ${formatRelativeTime(lastSyncTime)}`;
}

function setRefreshing(loading) {
  refreshBtn.disabled = loading;
  refreshBtn.textContent = loading ? "Refreshing…" : "Refresh";
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
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

setInterval(updateSyncStatus, 60_000);
