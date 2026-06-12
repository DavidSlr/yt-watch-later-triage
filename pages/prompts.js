// ============================================================================
// AI prompts — edit this file to tune what the AI generates for each section.
//
// Each section of the sidebar (Summary, Contextual Tags, Comment Sentiment)
// has its own prompt below. They are assembled into a single API request by
// buildPrompt(), so the video metadata is shared across sections.
//
// Placeholders available in section prompts (filled by buildPrompt):
//   {{title}} {{channel}} {{duration}} {{uploadDate}} {{description}}
// ============================================================================

const WLA_PROMPTS = {

  // Role + output contract sent as the system instruction.
  system: `You are an assistant inside a YouTube "Watch Later" triage tool.
You analyze video metadata and viewer comments to help the user quickly decide
whether and how to watch a video.

Respond with a single strict JSON object and nothing else — no markdown fences,
no commentary. Use exactly this shape:

{
  "summary": "string",
  "tags": { "context": ["string"], "type": ["string"] },
  "sentiment": {
    "positive": number, "neutral": number, "critical": number,
    "themes": [ { "tone": "positive"|"negative", "theme": "string", "quote": "string or null" } ]
  } | null
}`,

  sections: {

    summary: `## Summary
Write a 3-5 sentence summary of what this video covers. If a transcript is
provided, use it as the primary source — it is far more accurate than the
description. Otherwise rely on the title, channel, and description. Focus on
what the viewer will actually learn or see. Do not pad or speculate wildly.`,

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
Analyze the viewer comments provided below.
1. Estimate the rough share of positive / neutral / critical comments as
   percentages (integers summing to 100). This is a brief headline figure.
2. The main output: identify 2-4 general THEMES across the comments, each
   marked "positive" or "negative". A theme is a recurring observation, not a
   single opinion. For each theme give a short description (under 12 words).
   Include a short representative "quote" (verbatim from a comment, max 15
   words) only when one genuinely illustrates the theme — otherwise null.
If NO comments are provided, set the entire "sentiment" field to null.`,
  },

  // --------------------------------------------------------------------------
  // Assembles the section prompts + video data into the final user prompt.
  // --------------------------------------------------------------------------
  buildPrompt(video, comments, transcript = null) {
    const fill = (tpl) => tpl
      .replaceAll("{{title}}", video.title ?? "")
      .replaceAll("{{channel}}", video.channel ?? "")
      .replaceAll("{{duration}}", video.duration ?? "")
      .replaceAll("{{uploadDate}}", video.uploadDate ?? "")
      .replaceAll("{{description}}", video.description ?? "");

    const parts = [
      `# Video metadata`,
      `Title: ${video.title ?? "(unknown)"}`,
      `Channel: ${video.channel ?? "(unknown)"}`,
      `Duration: ${video.duration ?? "(unknown)"}`,
      `Uploaded: ${video.uploadDate ?? "(unknown)"}`,
      `Description snippet: ${video.description || "(none)"}`,
      ``,
      fill(this.sections.summary),
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
