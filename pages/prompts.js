// ============================================================================
// AI prompts — edit this file to tune what the AI generates for each section.
//
// Each section of the sidebar has its own prompt below. They are assembled into
// a single API request by buildPrompt(), so the video metadata is shared.
//
// Placeholders available in section prompts (filled by buildPrompt):
//   {{title}} {{channel}} {{duration}} {{uploadDate}} {{description}}
// ============================================================================

const WLA_PROMPTS = {

  // Role + output contract sent as the system instruction.
  system: `You are an assistant inside a YouTube "Watch Later" triage tool.
You analyze video metadata, transcript, and viewer comments to help the user quickly decide
whether and how to watch a video or which information can be taken away without watching it.

Respond with a single strict JSON object and nothing else — no markdown fences,
no commentary. Use exactly this shape:

{
  "summary": "string",
  "clickbait": "string or null",
  "takeaways": [{"label": "simple"|"worth watching", "point": "string", "ts": number|null}] or null,
  "tags": { "context": ["string"], "type": ["string"] },
  "sentiment": {
    "positive": number, "neutral": number, "critical": number,
    "themes": [ { "tone": "positive"|"negative", "theme": "string", "quote": "string or null" } ]
  } | null
}`,

  sections: {

    // Used when a transcript is available
    summary_transcript: `## Summary
Write a 1-3 sentence summary of what this video covers. Use the transcript as the primary source —
it is far more accurate than the description. Focus on what the viewer will actually learn or see.
Do not pad or speculate wildly.`,

    // Used when no transcript is available
    summary_no_transcript: `## Summary
Write a 1-3 sentence summary of what this video covers based on the title, channel, and description.
If the title is vague or click-baity, note this briefly. Do not pad or speculate wildly.`,

    // Always included — set to null when title is not click-baity
    clickbait: `## Click-bait answer
If the video title poses a question or makes a click-baity promise ("Is X the best?",
"You won't believe…", "The truth about…", etc.), provide a direct tl;dr answer based on
the transcript or description and put it in the "clickbait" field.
Set "clickbait" to null if the title is straightforward or if the answer is not discernible.`,

    // Requires transcript — set takeaways to null when no transcript
    takeaways: `## Key takeaways
Based on the transcript, extract key points a viewer could take away from this video.

LIST DETECTION: If the title promises a numbered list ("8 ways to…", "5 tips for…", "Top 10…",
"N reasons/things/steps/mistakes/hacks/…"), expand ALL those items as short headline-style
takeaways — one per listed item, even if some must be brief. Otherwise list 1–5 key points.

For each point:
- Classify as "simple" (one-liner, no need to watch) or "worth watching" (nuance/context adds value; add a brief hint)
- Add "ts": the integer seconds offset where this point is discussed. Find the [M:SS] marker
  immediately before the relevant passage in the transcript and convert it: ts = M*60 + S.
  Every [M:SS] marker in the transcript is a reliable seek point — always provide ts when a
  transcript is present; only set null if the passage genuinely cannot be located.

Return as [{"label": "simple"|"worth watching", "point": "...", "ts": number|null}].
If no transcript is available, set "takeaways" to null.`,

    tags: `## Contextual tags
Classify the video on two axes. Choose ONLY from these exact values:
- "context" (how to best watch it — pick exactly one):
  "quick watch"        — short or skimmable, fine in a spare moment
  "deep dive"          — long-form or dense, deserves full attention
  "passive listening"  — works as audio-only / background listening
- "type" (what kind of content — pick one, max two):
  "tutorial", "commentary", "demo", "talk", "documentary",
  "entertainment", "news", "review"`,

    sentiment: `## Comment sentiment
Analyze the viewer comments provided below. Positive and Critical in this context means if the
comment generally agrees with the video's message or not, rather than the comment's tone.
1. Estimate the rough share of positive / neutral / critical comments as
   percentages (integers summing to 100). This is a brief headline figure.
2. The main output: identify 2-4 general THEMES across the comments, each
   marked "positive" or "critical". A theme is a recurring observation, not a
   single opinion. For each theme give a short description (under 12 words).
   Include a short representative "quote" (verbatim from a comment, max 15
   words) only when one genuinely illustrates the theme — otherwise null.
If NO comments are provided, set the entire "sentiment" field to null.`,
  },

  // --------------------------------------------------------------------------
  // Assembles the section prompts + video data into the final user prompt.
  // Selects the appropriate summary prompt based on transcript availability.
  // --------------------------------------------------------------------------
  buildPrompt(video, comments, transcript = null) {
    const fill = (tpl) => tpl
      .replaceAll("{{title}}", video.title ?? "")
      .replaceAll("{{channel}}", video.channel ?? "")
      .replaceAll("{{duration}}", video.duration ?? "")
      .replaceAll("{{uploadDate}}", video.uploadDate ?? "")
      .replaceAll("{{description}}", video.description ?? "");

    const summaryPrompt = transcript
      ? this.sections.summary_transcript
      : this.sections.summary_no_transcript;

    const parts = [
      `# Video metadata`,
      `Title: ${video.title ?? "(unknown)"}`,
      `Channel: ${video.channel ?? "(unknown)"}`,
      `Duration: ${video.duration ?? "(unknown)"}`,
      `Uploaded: ${video.uploadDate ?? "(unknown)"}`,
      `Description snippet: ${video.description || "(none)"}`,
      ``,
      fill(summaryPrompt),
      ``,
      fill(this.sections.clickbait),
      ``,
      fill(this.sections.takeaways),
      ``,
      fill(this.sections.tags),
      ``,
      fill(this.sections.sentiment),
      ``,
      `# Transcript`,
      transcript ?? "(no transcript available — captions may be disabled for this video)",
      ``,
      `# Viewer comments (${comments.length})`,
      comments.length
        ? comments.map((c, i) => `${i + 1}. ${c}`).join("\n")
        : "(no comments available)",
    ];
    return parts.join("\n");
  },
};
