import { html, svg } from 'lit';
import { ICONS } from '../../components/wla-button.js';

export default {
  title: 'Foundation/Icons',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

// ── App icons ────────────────────────────────────────────────────────────────

const APP_ICONS = [
  {
    name: 'icon.svg',
    label: 'SVG source',
    usage: 'Title bar logo',
    content: html`<img src="icon.svg" width="40" height="40" alt="App icon SVG" />`,
  },
  {
    name: 'icon-48.png',
    label: '48 × 48 px',
    usage: 'Manifest · browser toolbar',
    content: html`<img src="icon-48.png" width="40" height="40" alt="App icon 48px" />`,
  },
  {
    name: 'icon-96.png',
    label: '96 × 96 px',
    usage: 'Manifest · high-DPI displays',
    content: html`<img src="icon-96.png" width="40" height="40" alt="App icon 96px" />`,
  },
];

// ── Shared action icons (from wla-button.js's ICONS map) ─────────────────────
// Rendered from the live map, not copied — an icon added, changed, or
// removed there shows up (or disappears) here automatically.

const SHARED_USAGE = {
  refresh:       'Reload Watch Later list',
  settings:      'AI settings button',
  close:         'Buttons, modal dismiss, queue-card remove',
  play:          'Accordion expand, queue card seek',
  'arrow-left':  'Queue scroll previous',
  'arrow-right': 'Queue scroll next, button icon',
};

const SHARED_ICONS = Object.entries(ICONS).map(([name, path]) => ({
  name,
  usage: SHARED_USAGE[name] ?? '',
  svg: svg`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">${path}</svg>`,
}));

// ── Component-local icons ─────────────────────────────────────────────────────
// Each of these is a one-off inline SVG inside its own component, not
// centralized anywhere — unlike the shared list above, there's no live
// source to render these from, so they're copied by hand and can drift if
// the component's own icon changes without this being updated too.

const LOCAL_ICONS = [
  {
    name: 'Play (small)',
    usage: 'Timestamp hover indicator — wla-takeaway',
    svg: html`<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M3 2.5l10 5.5-10 5.5V2.5z"/></svg>`,
  },
  {
    name: 'Double chevron',
    usage: 'Queue collapse/expand toggle — watchlater.html',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 15.5 6 9.5l1.41-1.41L12 12.67l4.59-4.58L18 9.5z"/>
      <path d="M12 21 6 15l1.41-1.41L12 18.17l4.59-4.58L18 15z"/>
    </svg>`,
  },
  {
    name: 'Eye (visible)',
    usage: 'Password field — show password — wla-form-field',
    svg: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,
  },
  {
    name: 'Eye (hidden)',
    usage: 'Password field — hide password — wla-form-field',
    svg: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>`,
  },
  {
    name: 'YouTube',
    usage: 'Analysis source — wla-analyzing',
    svg: html`<svg viewBox="4 4 34 32" fill="currentColor" width="22" height="20">
      <mask id="icons-yt-cutout"><rect x="0" y="0" width="40" height="40" fill="white"/><path d="M17 13.5 L27 20 L17 26.5 Z" fill="black"/></mask>
      <rect x="4" y="8" width="34" height="24" rx="7" mask="url(#icons-yt-cutout)"/>
    </svg>`,
  },
  {
    name: 'AI sparkle',
    usage: 'Analysis target — wla-analyzing',
    svg: html`<svg viewBox="164 2 34 32" fill="currentColor" width="22" height="20">
      <path d="M178 7 C179.6 15.4 181.6 17.4 190 19 C181.6 20.6 179.6 22.6 178 31 C176.4 22.6 174.4 20.6 166 19 C174.4 17.4 176.4 15.4 178 7 Z"/>
      <path d="M192 4 C192.5 6.5 193.5 7.5 196 8 C193.5 8.5 192.5 9.5 192 12 C191.5 9.5 190.5 8.5 188 8 C190.5 7.5 191.5 6.5 192 4 Z"/>
      <path d="M191 27 C191.4 29 192 29.6 194 30 C192 30.4 191.4 31 191 33 C190.6 31 190 30.4 188 30 C190 29.6 190.6 29 191 27 Z"/>
    </svg>`,
  },
];

// ── Card renderers ────────────────────────────────────────────────────────────

const card = (inner, name, sub, note) => html`
  <div style="
    display:flex;flex-direction:column;align-items:center;gap:10px;
    padding:16px;
    background:var(--color-surface,#1a1a1a);
    border:1px solid var(--color-border,#2e2e2e);
    border-radius:var(--radius,8px);
    min-width:120px;
  ">
    <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:var(--color-text,#e8e8e8)">
      ${inner}
    </div>
    <div style="text-align:center">
      <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name}</div>
      <div style="font-size:11px;color:var(--color-text-muted,#aaa);margin-top:2px;font-family:monospace">${sub}</div>
      <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:3px;max-width:110px;line-height:1.4">${note}</div>
    </div>
  </div>
`;

const sectionLabel = (text) => html`
  <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin:0 0 12px">${text}</div>
`;

export const AllIcons = {
  name: 'All Icons',
  render: () => html`
    <div style="max-width:700px">

      ${sectionLabel('App Icon')}
      <p style="font-size:13px;color:var(--color-text-muted,#aaa);margin:0 0 16px;line-height:1.5">
        Single SVG source in <code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">icons/icon.svg</code>.
        PNGs are generated from it via <code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">sips</code> and registered in <code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">manifest.json</code>.
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:40px">
        ${APP_ICONS.map(({ content, name, label, usage }) => card(content, label, name, usage))}
      </div>

      ${sectionLabel('Shared action icons')}
      <p style="font-size:13px;color:var(--color-text-muted,#aaa);margin:0 0 16px;line-height:1.5">
        Rendered live from <code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">wla-button.js</code>'s <code style="font-size:11px;background:#222;padding:1px 4px;border-radius:3px">ICONS</code> map — add or change an icon there and it updates here automatically.
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:40px">
        ${SHARED_ICONS.map(({ svg, name, usage }) => card(svg, name, '', usage))}
      </div>

      ${sectionLabel('Component-local icons')}
      <p style="font-size:13px;color:var(--color-text-muted,#aaa);margin:0 0 16px;line-height:1.5">
        One-off inline SVGs, each local to a single component — no shared map to render these from, so they're copied by hand here and can go stale if the source changes.
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${LOCAL_ICONS.map(({ svg, name, usage }) => card(svg, name, '', usage))}
      </div>

    </div>
  `,
};
