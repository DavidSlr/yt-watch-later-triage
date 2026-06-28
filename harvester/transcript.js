// Transcript fetching via yt-caption-kit, which handles YouTube's session
// requirements without needing a real browser. Public videos only.

import {
  YtCaptionKit,
  TranscriptsDisabled,
  NoTranscriptFound,
  VideoUnavailable,
  AgeRestricted,
  PoTokenRequired,
  RequestBlocked,
  IpBlocked,
} from "yt-caption-kit";

const api = new YtCaptionKit();

// Serialize fetches one at a time to avoid hammering YouTube.
let queue = Promise.resolve();
export function fetchTranscript(videoId) {
  const run = () => doFetch(videoId);
  const result = queue.then(run, run);
  queue = result.then(() => {}, () => {});
  return result;
}

async function doFetch(videoId) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const job = { videoId, startedAt, durationMs: 0, outcome: null, step: "fetch", message: null };

  try {
    // Prefer manually-created transcripts; fall back to auto-generated.
    const transcript = await api.fetch(videoId, { languages: ["en", "de", "en-US", "en-GB"] });

    const text = snippetsToString(transcript.snippets);
    job.durationMs = Date.now() - t0;
    job.outcome = "ok";
    job.message = `${transcript.snippets.length} snippets, lang=${transcript.languageCode}, generated=${transcript.isGenerated}`;
    return { status: "ok", transcript: text, job };
  } catch (e) {
    job.durationMs = Date.now() - t0;

    if (e instanceof TranscriptsDisabled || e instanceof NoTranscriptFound) {
      job.outcome = "no_transcript";
      job.message = e.message || e.constructor.name;
      return { status: "none", transcript: null, job };
    }

    if (e instanceof VideoUnavailable || e instanceof AgeRestricted) {
      job.outcome = "no_transcript";
      job.message = e.constructor.name;
      return { status: "none", transcript: null, job };
    }

    // PoTokenRequired / RequestBlocked / IpBlocked — transient, not the video's fault
    job.outcome = "error";
    job.message = (e && e.message ? e.message : String(e)).slice(0, 400);
    return { status: "error", transcript: null, job };
  }
}

function snippetsToString(snippets) {
  const lines = [];
  let lastMarkerSec = -60;
  for (const s of snippets) {
    const text = (s.text || "").replace(/\n/g, " ").trim();
    if (!text) continue;
    const sec = Math.floor(s.start);
    if (sec - lastMarkerSec >= 10) {
      lines.push(`[${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}]`);
      lastMarkerSec = sec;
    }
    lines.push(text);
  }
  return lines.join(" ").replace(/\s+/g, " ").trim().slice(0, 10000);
}

export function getDiagnostics() {
  return { backend: "yt-caption-kit" };
}
