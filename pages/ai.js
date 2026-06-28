// ============================================================================
// AI provider adapter — Gemini (free tier) and Claude (user API key).
// Settings live in browser.storage.local under "aiSettings".
// ============================================================================

const WLA_AI = {

  DEFAULTS: {
    gemini: { model: "gemini-2.5-flash" },
    claude: { model: "claude-haiku-4-5" },
  },

  // Returns flat { provider, apiKey, model } for the active provider.
  // Handles both the new per-provider format and the legacy flat format.
  async getSettings() {
    const { aiSettings } = await browser.storage.local.get("aiSettings");
    const provider = aiSettings?.provider ?? "gemini";
    let apiKey, model;
    if (aiSettings && typeof aiSettings[provider] === "object") {
      // New per-provider format: { provider, gemini: {apiKey, model}, claude: {apiKey, model} }
      const ps = aiSettings[provider] ?? {};
      apiKey = ps.apiKey ?? "";
      model  = ps.model  ?? "";
    } else {
      // Legacy flat format: { provider, apiKey, model }
      apiKey = aiSettings?.apiKey ?? "";
      model  = aiSettings?.model  ?? "";
    }
    return { provider, apiKey, model };
  },

  // Returns all per-provider settings for the modal.
  // Migrates legacy flat format automatically.
  async getAllProviderSettings() {
    const { aiSettings } = await browser.storage.local.get("aiSettings");
    const provider = aiSettings?.provider ?? "gemini";
    if (aiSettings && typeof aiSettings.gemini === "object") {
      return {
        provider,
        gemini: { apiKey: aiSettings.gemini?.apiKey ?? "", model: aiSettings.gemini?.model ?? "" },
        claude: { apiKey: aiSettings.claude?.apiKey ?? "", model: aiSettings.claude?.model ?? "" },
      };
    }
    // Migrate legacy format: put the saved key under its provider
    const result = {
      provider,
      gemini: { apiKey: "", model: "" },
      claude:  { apiKey: "", model: "" },
    };
    if (aiSettings?.apiKey) result[provider] = { apiKey: aiSettings.apiKey, model: aiSettings.model ?? "" };
    return result;
  },

  async saveAllProviderSettings(all) {
    await browser.storage.local.set({ aiSettings: all });
  },

  async isConfigured() {
    const s = await this.getSettings();
    return !!s.apiKey;
  },

  // --------------------------------------------------------------------------
  // Main entry: analyze a video. Returns the parsed JSON analysis object.
  // --------------------------------------------------------------------------
  async analyze(video, comments, transcript = null) {
    const settings = await this.getSettings();
    if (!settings.apiKey) throw new Error("NO_API_KEY");

    const model = settings.model || this.DEFAULTS[settings.provider]?.model;
    const prompt = WLA_PROMPTS.buildPrompt(video, comments, transcript);

    const raw = settings.provider === "claude"
      ? await this.callClaude(settings.apiKey, model, prompt)
      : await this.callGemini(settings.apiKey, model, prompt);

    return this.parseAnalysis(raw);
  },

  // Minimal request to verify a key/model works (used by the Test button)
  async test() {
    const settings = await this.getSettings();
    if (!settings.apiKey) throw new Error("NO_API_KEY");
    const model = settings.model || this.DEFAULTS[settings.provider]?.model;
    const prompt = 'Reply with exactly this JSON: {"ok": true}';
    const raw = settings.provider === "claude"
      ? await this.callClaude(settings.apiKey, model, prompt)
      : await this.callGemini(settings.apiKey, model, prompt);
    return raw.includes("true");
  },

  // --------------------------------------------------------------------------
  // Providers
  // --------------------------------------------------------------------------
  async callGemini(apiKey, model, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: WLA_PROMPTS.system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Gemini API HTTP ${resp.status}: ${this.extractApiError(body)}`);
    }

    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(`Gemini returned no text (finishReason: ${json?.candidates?.[0]?.finishReason ?? "unknown"})`);
    return text;
  },

  async callClaude(apiKey, model, prompt) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2500,
        system: WLA_PROMPTS.system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Claude API HTTP ${resp.status}: ${this.extractApiError(body)}`);
    }

    const json = await resp.json();
    const text = json?.content?.find(b => b.type === "text")?.text;
    if (!text) throw new Error(`Claude returned no text (stop_reason: ${json?.stop_reason ?? "unknown"})`);
    return text;
  },

  // --------------------------------------------------------------------------
  // Response handling
  // --------------------------------------------------------------------------
  parseAnalysis(raw) {
    // Strip markdown fences if the model added them despite instructions
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    let data;
    try {
      data = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`AI response was not valid JSON: ${cleaned.slice(0, 200)}`);
    }
    if (typeof data.summary !== "string") {
      throw new Error("AI response missing 'summary' field");
    }
    return {
      summary: data.summary,
      clickbait: data.clickbait ? String(data.clickbait) : null,
      takeaways: Array.isArray(data.takeaways)
        ? data.takeaways
            .filter(t => t && t.point)
            .map(t => ({
              label: t.label === "worth watching" ? "worth watching" : "simple",
              point: String(t.point),
              ts: typeof t.ts === "number" ? Math.round(t.ts) : null,
            }))
        : null,
      tags: {
        context: Array.isArray(data.tags?.context) ? data.tags.context : [],
        type: Array.isArray(data.tags?.type) ? data.tags.type : [],
      },
      sentiment: data.sentiment && typeof data.sentiment === "object"
        ? {
            positive: Number(data.sentiment.positive) || 0,
            neutral: Number(data.sentiment.neutral) || 0,
            critical: Number(data.sentiment.critical) || 0,
            themes: Array.isArray(data.sentiment.themes)
              ? data.sentiment.themes
                  .filter(t => t && t.theme)
                  .map(t => ({
                    tone: t.tone === "negative" ? "negative" : "positive",
                    theme: String(t.theme),
                    quote: t.quote ? String(t.quote) : null,
                  }))
              : [],
          }
        : null,
    };
  },

  extractApiError(body) {
    try {
      const j = JSON.parse(body);
      return j?.error?.message ?? j?.message ?? body.slice(0, 300);
    } catch {
      return body.slice(0, 300);
    }
  },
};
