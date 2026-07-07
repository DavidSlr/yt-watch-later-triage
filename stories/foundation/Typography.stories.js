import { html } from 'lit';

export default {
  title: 'Foundation/Typography',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const SCALE = [
  { token: '--font-size-xl',  size: '20px', rem: '1.25rem',   weight: 700, label: 'xl · Bold',     sample: 'Watch Later' },
  { token: '--font-size-lg',  size: '17px', rem: '1.0625rem', weight: 600, label: 'lg · Semibold', sample: 'Modal heading' },
  { token: '--font-size-base',size: '14px', rem: '0.875rem',  weight: 400, label: 'base · Normal', sample: 'Default body text and descriptions' },
  { token: '--font-size-sm',  size: '12px', rem: '0.75rem',   weight: 400, label: 'sm · Normal',   sample: 'Timestamps, hints, badges' },
];

const TEXT_STYLES = [
  { name: 'title',   token: '--text-title-size',   weight: 700, color: 'text',          lineHeight: 'tight', size: 'xl · 20px · bold',      sample: 'Watch Later',                                            description: 'Page / extension title' },
  { name: 'heading', token: '--text-heading-size',  weight: 600, color: 'text',          lineHeight: 'tight', size: 'lg · 17px · semibold',  sample: 'AI Settings',                                            description: 'Panel headings, modal titles' },
  { name: 'ui',      token: '--text-body-size',     weight: 600, color: 'text',          lineHeight: 'tight', size: 'base · 14px · semibold',sample: 'Refresh list',                                           description: 'Interactive elements — buttons, menu items' },
  { name: 'body',    token: '--text-body-size',     weight: 400, color: 'text',          lineHeight: 'base',  size: 'base · 14px · normal',  sample: 'A clear explanation of what this video covers and why.',  description: 'Default body text, descriptions, inputs' },
  { name: 'label',   token: '--text-label-size',    weight: 600, color: 'text',          lineHeight: 'tight', size: 'base · 14px · semibold',sample: 'API Key',                                                description: 'Form labels, section headings, tab text' },
  { name: 'hint',    token: '--text-caption-size',  weight: 400, color: 'text-muted',    lineHeight: 'base',  size: 'sm · 12px · normal',    sample: 'Paste your Gemini API key here. It is stored locally.',   description: 'Form hints, helper text, secondary content' },
  { name: 'caption', token: '--text-caption-size',  weight: 400, color: 'text-disabled', lineHeight: 'base',  size: 'sm · 12px · normal',    sample: '28:14 · 2 weeks ago',                                    description: 'Timestamps, badges, inline metadata' },
];

const LINE_HEIGHT_MAP = {
  tight: 'var(--line-height-tight, 1.25)',
  base: 'var(--line-height-base, 1.45)',
  relaxed: 'var(--line-height-relaxed, 1.6)',
};

const COLOR_MAP = {
  'text':          { css: 'var(--color-text, #e8e8e8)',          hex: '#e8e8e8', token: '--color-text' },
  'text-muted':    { css: 'var(--color-text-muted, #aaa)',       hex: '#aaaaaa', token: '--color-text-muted' },
  'text-disabled': { css: 'var(--color-text-disabled, #555)',    hex: '#555555', token: '--color-text-disabled' },
};

const WEIGHTS = [
  { token: '--font-weight-normal',   value: 400, label: 'Normal 400' },
  { token: '--font-weight-semibold', value: 600, label: 'Semibold 600' },
  { token: '--font-weight-bold',     value: 700, label: 'Bold 700' },
];

const LINE_HEIGHTS = [
  { token: '--line-height-tight',   value: '1.25', label: 'tight',   sample: 'A tight line height used for headings and compact UI. The quick brown fox.' },
  { token: '--line-height-base',    value: '1.45', label: 'base',    sample: 'The default line height for body copy and most interface text. The quick brown fox.' },
  { token: '--line-height-relaxed', value: '1.6',  label: 'relaxed', sample: 'More breathing room for longer paragraphs and readable content. The quick brown fox.' },
];

export const TypeScale = {
  name: 'Type Scale',
  render: () => html`
    <div style="max-width:700px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:16px">Size scale</div>
      ${SCALE.map(({ token, size, rem, weight, label, sample }) => html`
        <div style="
          display:flex;align-items:baseline;gap:16px;padding:10px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="width:220px;flex-shrink:0">
            <div style="font-size:var(${token});font-weight:${weight};color:var(--color-text,#e8e8e8);line-height:1.3">${sample}</div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${label}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${token} · ${size} / ${rem}</div>
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
        Semantic roles combining size, weight, and color. Semantic size aliases (<code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">--text-*-size</code>) are available as CSS custom properties. Full composite tokens are in <code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">tokens.json → textStyle</code> for Figma.
      </p>
      ${TEXT_STYLES.map(({ name, token, size, color, lineHeight, sample, description, weight }) => html`
        <div style="
          display:flex;align-items:flex-start;gap:20px;padding:14px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="width:220px;flex-shrink:0">
            <div style="
              font-size:var(${token});
              font-weight:${weight};
              color:${COLOR_MAP[color].css};
              line-height:${LINE_HEIGHT_MAP[lineHeight]};
            ">${sample}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace;margin-top:2px">${size}</div>
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
      ${WEIGHTS.map(({ token, value, label }) => html`
        <div style="
          display:flex;align-items:center;gap:24px;padding:12px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="font-size:16px;font-weight:${value};color:var(--color-text,#e8e8e8);width:200px">The quick brown fox</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${label}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${token}</div>
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
      ${LINE_HEIGHTS.map(({ token, value, label, sample }) => html`
        <div style="
          display:flex;gap:24px;padding:16px 0;
          border-bottom:1px solid var(--color-border,#2e2e2e);
        ">
          <div style="width:280px;flex-shrink:0;font-size:14px;line-height:${value};color:var(--color-text,#e8e8e8)">${sample}</div>
          <div style="padding-top:2px">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${label} · ${value}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${token}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};
