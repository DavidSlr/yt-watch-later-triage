import { html } from 'lit';
import tokensRaw from '../../tokens/tokens.css?raw';
import tokensJson from '../../tokens/tokens.json';
import { parseTokenGroups } from './_parseTokens.js';

export default {
  title: 'Foundation/Typography',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

// Primitive scale (size/weight/line-height) comes straight from tokens.css —
// it's what the app actually renders with, so it's the more authoritative
// source between the two token files for these raw values.
const SCALE = parseTokenGroups(tokensRaw, '--font-size-')[0]?.tokens ?? [];
const WEIGHTS = parseTokenGroups(tokensRaw, '--font-weight-')[0]?.tokens ?? [];
const LINE_HEIGHTS = parseTokenGroups(tokensRaw, '--line-height-')[0]?.tokens ?? [];

// The named text styles (title, heading, body, ...) are composite
// size+weight+line-height combinations with no equivalent in tokens.css —
// that mapping only exists in tokens.json's textStyle group, so that's the
// source of truth for this table specifically.
function resolveAlias(value) {
  const m = typeof value === 'string' && value.match(/^\{([\w.]+)\}$/);
  if (!m) return value;
  return m[1].split('.').reduce((node, key) => node?.[key], tokensJson)?.$value ?? value;
}

// Sample text and which text-color token to demo each style with are
// presentation choices with nothing to derive them from — those stay
// hand-authored. Everything else (size, weight, line-height, description)
// is read from tokens.json, so it can't drift from the actual token values.
const SAMPLES = {
  title:   { color: 'text',          sample: 'Watch Later' },
  heading: { color: 'text',          sample: 'AI Settings' },
  ui:      { color: 'text',          sample: 'Refresh list' },
  body:    { color: 'text',          sample: 'A clear explanation of what this video covers and why.' },
  label:   { color: 'text',          sample: 'API Key' },
  hint:    { color: 'text-muted',    sample: 'Paste your Gemini API key here. It is stored locally.' },
  caption: { color: 'text-disabled', sample: '28:14 · 2 weeks ago' },
};
// Display order only — if a new textStyle is added to tokens.json without
// updating this, it still appears (sorted to the end), just without a
// curated sample; nothing silently goes missing.
const ORDER = ['title', 'heading', 'ui', 'body', 'label', 'hint', 'caption'];

const COLOR_MAP = {
  'text':          { css: 'var(--color-text, #e8e8e8)',          hex: '#e8e8e8', token: '--color-text' },
  'text-muted':    { css: 'var(--color-text-muted, #aaa)',       hex: '#aaaaaa', token: '--color-text-muted' },
  'text-disabled': { css: 'var(--color-text-disabled, #555)',    hex: '#555555', token: '--color-text-disabled' },
};

const TEXT_STYLES = Object.entries(tokensJson.textStyle)
  .map(([name, def]) => ({
    name,
    description: def.$description ?? '',
    size: resolveAlias(def.fontSize.$value),
    weight: resolveAlias(def.fontWeight.$value),
    lineHeight: resolveAlias(def.lineHeight.$value),
    color: SAMPLES[name]?.color ?? 'text',
    sample: SAMPLES[name]?.sample ?? 'The quick brown fox jumps over the lazy dog.',
  }))
  .sort((a, b) => {
    const ia = ORDER.indexOf(a.name), ib = ORDER.indexOf(b.name);
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

export const TypeScale = {
  name: 'Type Scale',
  render: () => html`
    <div style="max-width:700px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:16px">Size scale</div>
      ${SCALE.map(({ name, value, note }) => html`
        <div style="
          display:flex;align-items:baseline;gap:16px;padding:10px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="width:220px;flex-shrink:0">
            <div style="font-size:var(${name});font-weight:600;color:var(--color-text,#e8e8e8);line-height:1.3">${name.replace('--font-size-', '')}</div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name.replace('--font-size-', '')}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${name} · ${value}${note ? ` / ${note}` : ''}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const TextStyles = {
  name: 'Text Styles',
  render: () => html`
    <div style="max-width:700px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:4px">Text styles</div>
      <p style="font-size:12px;color:var(--color-text-muted,#aaa);margin:0 0 20px;line-height:1.5">
        Semantic roles combining size, weight, and line-height. Defined once in <code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">tokens.json → textStyle</code> (also the format Figma Variables consume) — sample text and color role are the only parts authored here.
      </p>
      ${TEXT_STYLES.map(({ name, size, weight, lineHeight, color, sample, description }) => html`
        <div style="
          display:flex;align-items:flex-start;gap:20px;padding:14px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="width:220px;flex-shrink:0">
            <div style="
              font-size:${size};
              font-weight:${weight};
              color:${COLOR_MAP[color].css};
              line-height:${lineHeight};
            ">${sample}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace;margin-top:2px">${size} · ${weight} · ${lineHeight}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <div style="
                width:10px;height:10px;border-radius:50%;flex-shrink:0;
                background:${COLOR_MAP[color].hex};
                border:1px solid rgba(255,255,255,0.12);
              "></div>
              <div style="font-size:11px;color:var(--color-text-disabled,#555);font-family:monospace">${COLOR_MAP[color].token}</div>
            </div>
            <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:3px">${description}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const FontWeights = {
  name: 'Font Weights',
  render: () => html`
    <div style="max-width:500px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:16px">Weights</div>
      ${WEIGHTS.map(({ name, value }) => html`
        <div style="
          display:flex;align-items:center;gap:24px;padding:12px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="font-size:16px;font-weight:${value};color:var(--color-text,#e8e8e8);width:200px">The quick brown fox</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name.replace('--font-weight-', '')} ${value}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${name}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const LineHeights = {
  name: 'Line Heights',
  render: () => html`
    <div style="max-width:600px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:16px">Line heights</div>
      ${LINE_HEIGHTS.map(({ name, value }) => html`
        <div style="
          display:flex;gap:24px;padding:16px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="width:280px;flex-shrink:0;font-size:14px;line-height:${value};color:var(--color-text,#e8e8e8)">The quick brown fox jumps over the lazy dog. Used here to preview how this line height reads across a couple of lines.</div>
          <div style="padding-top:2px">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name.replace('--line-height-', '')} · ${value}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${name}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};
