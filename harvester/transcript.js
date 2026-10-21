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
    const track = pickTrack([...(await api.list(videoId))]);
    if (!track) {
      job.durationMs = Date.now() - t0;
      job.outcome = "no_transcript";
      job.message = "no caption tracks";
      return { status: "none", transcript: null, job };
    }
    const transcript = await track.fetch();

    const text = snippetsToString(transcript.snippets);
    job.durationMs = Date.now() - t0;
    job.outcome = "ok";
    job.message = `${transcript.snippets.length} snippets, lang=${transcript.languageCode}, generated=${transcript.isGenerated}`;
    return { status: "ok", transcript: text, language: transcript.languageCode, job };
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

// Pick the track in the language spoken in the video. YouTube's auto-generated
// (ASR) track is transcribed from the audio, so its language is the spoken one.
// Videos with AI-dubbed audio get an extra ASR track per dub, listed first for
// that locale; those carry a `variant` URL param (e.g. "timing-optimized")
// while the original-audio track doesn't, so prefer ASR tracks without one.
// Prefer a manually-created track in that language, then the ASR track itself.
// Without an ASR track, fall back to the old en/de preference among manual tracks.
const FALLBACK_LANGUAGES = ["en", "de", "en-US", "en-GB"];
function pickTrack(tracks) {
  const generated = tracks.filter(t => t.isGenerated);
  const asr = generated.find(t => !new URL(t.url).searchParams.has("variant")) ?? generated[0];
  if (asr) {
    const base = (code) => code.split("-")[0];
    return tracks.find(t => !t.isGenerated && base(t.languageCode) === base(asr.languageCode)) ?? asr;
  }
  for (const lang of FALLBACK_LANGUAGES) {
    const t = tracks.find(t => t.languageCode === lang);
    if (t) return t;
  }
  return tracks[0] ?? null;
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
