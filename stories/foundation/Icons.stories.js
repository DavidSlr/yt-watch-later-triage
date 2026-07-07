import { html } from 'lit';

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

// ── UI icons (inline SVG, embedded in components) ────────────────────────────

const UI_ICONS = [
  {
    name: 'Close',
    usage: 'Modal dismiss, accordion collapse',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
  },
  {
    name: 'Play / Chevron',
    usage: 'Accordion expand, queue card seek',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>`,
  },
  {
    name: 'Play (small)',
    usage: 'Timestamp hover indicator',
    svg: html`<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M3 2.5l10 5.5-10 5.5V2.5z"/></svg>`,
  },
  {
    name: 'Arrow up',
    usage: 'Queue collapse toggle',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`,
  },
  {
    name: 'Arrow left',
    usage: 'Queue scroll previous',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
  },
  {
    name: 'Arrow right',
    usage: 'Queue scroll next, button icon',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
  },
  {
    name: 'Refresh',
    usage: 'Reload Watch Later list',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
  },
  {
    name: 'Settings',
    usage: 'AI settings button',
    svg: html`<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.484.484 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.61 3.61 0 0 1 8.4 12c0-1.98 1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
  },
  {
    name: 'Eye (visible)',
    usage: 'Password field — show password',
    svg: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,
  },
  {
    name: 'Eye (hidden)',
    usage: 'Password field — hide password',
    svg: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
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

      ${sectionLabel('UI Icons')}
      <p style="font-size:13px;color:var(--color-text-muted,#aaa);margin:0 0 16px;line-height:1.5">
        Inline SVG only — no icon library. Each icon is embedded directly in the component that uses it.
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${UI_ICONS.map(({ svg, name, usage }) => card(svg, name, '', usage))}
      </div>

    </div>
  `,
};
