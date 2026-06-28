// Tiny HTTP server exposing the transcript microservice.
//   GET /transcript?v=VIDEO_ID  → 200 {videoId, transcript} | 404 {error} | 5xx {error}
//   GET /health                 → 200 {ok:true}
//   GET /status                 → diagnostics + recent jobs
//   GET /jobs                   → recent-jobs ring buffer

import http from "http";
import { createRequire } from "module";
import { fetchTranscript, getDiagnostics } from "./transcript.js";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

const PORT = parseInt(process.env.WLA_HARVESTER_PORT || "47823", 10);
const startedAt = new Date().toISOString();

const counters = { total: 0, success: 0, no_transcript: 0, error: 0 };
const recentJobs = [];
const MAX_JOBS = 50;
let lastError = null;

function recordJob(job) {
  recentJobs.push(job);
  while (recentJobs.length > MAX_JOBS) recentJobs.shift();
  if (job.outcome === "ok") counters.success++;
  else if (job.outcome === "no_transcript") counters.no_transcript++;
  else if (job.outcome === "error") {
    counters.error++;
    lastError = { videoId: job.videoId, time: job.startedAt, step: job.step, message: job.message };
  }
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, `http://localhost:${PORT}`); }
  catch (_) { return sendJson(res, 400, { error: "bad url" }); }

  if (req.method !== "GET") return sendJson(res, 405, { error: "method not allowed" });

  if (url.pathname === "/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/status") {
    return sendJson(res, 200, {
      service: {
        startedAt,
        uptimeSec: Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
        version: pkg.version,
      },
      backend: getDiagnostics(),
      counters,
      lastError,
      recentJobs: recentJobs.slice().reverse(),
    });
  }

  if (url.pathname === "/jobs") {
    return sendJson(res, 200, { recentJobs: recentJobs.slice().reverse() });
  }

  if (url.pathname === "/transcript") {
    const videoId = url.searchParams.get("v") || "";
    if (!VIDEO_ID_RE.test(videoId)) {
      return sendJson(res, 400, { error: "missing or invalid ?v= (expected 11-char video id)" });
    }
    counters.total++;
    let result;
    try {
      result = await fetchTranscript(videoId);
    } catch (e) {
      const job = { videoId, startedAt: new Date().toISOString(), durationMs: 0, outcome: "error", step: "internal", message: e?.message ?? String(e) };
      recordJob(job);
      return sendJson(res, 500, { error: job.message });
    }
    recordJob(result.job);

    if (result.status === "ok") {
      return sendJson(res, 200, { videoId, transcript: result.transcript });
    }
    if (result.status === "none") {
      return sendJson(res, 404, { error: "no transcript available", reason: result.job.message });
    }
    return sendJson(res, 500, { error: result.job.message || "transcript fetch failed" });
  }

  return sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`[harvester] listening on :${PORT} (v${pkg.version})`);
});
