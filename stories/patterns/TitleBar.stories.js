import { html } from 'lit';
import '../../components/wla-chip.js';
import '../../components/wla-button.js';

export default {
  title: 'Patterns/Title Bar',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { height: '72px' },
      description: { component: 'The extension\'s top bar — logo, title, video-count [`wla-chip`](?path=/story/components-chip--default), and a settings [`wla-button`](?path=/story/components-button--default). Mirrors the real markup in `pages/watchlater.html`. The debug button only appears after a fetch error, so it\'s off by default here.' },
    },
  },
};

const logoIcon = html`<svg viewBox="0 0 32 32" fill="none" width="26" height="26" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#wla-logo-clip-story)">
    <path d="M32 32H-1V0H32V32ZM22.9375 6.53418C22.6152 5.6641 21.3848 5.6641 21.0625 6.53418L19.459 10.8682C19.3577 11.1417 19.1417 11.3577 18.8682 11.459L14.5342 13.0625C13.6641 13.3848 13.6641 14.6152 14.5342 14.9375L18.8682 16.541C19.1417 16.6423 19.3577 16.8583 19.459 17.1318L21.0625 21.4658C21.3848 22.3359 22.6152 22.3359 22.9375 21.4658L24.541 17.1318C24.6423 16.8583 24.8583 16.6423 25.1318 16.541L29.4658 14.9375C30.3359 14.6152 30.3359 13.3848 29.4658 13.0625L25.1318 11.459C24.8583 11.3577 24.6423 11.1417 24.541 10.8682L22.9375 6.53418Z" fill="#28ADA0"/>
    <path d="M10.2185 9.83193C10.0753 10.0857 9.99992 10.3738 10 10.6671V22.3329C9.99992 22.6262 10.0753 22.9143 10.2185 23.1681C10.3616 23.4219 10.5676 23.6325 10.8155 23.7785C11.0634 23.9246 11.3445 24.001 11.6304 24C11.9163 23.999 12.1969 23.9206 12.4438 23.7729L22.1931 17.9399C22.4388 17.7931 22.6426 17.5827 22.7842 17.3297C22.9258 17.0768 23.0002 16.7901 23 16.4984C22.9998 16.2068 22.9249 15.9203 22.7828 15.6676C22.6408 15.4149 22.4366 15.2048 22.1906 15.0584L12.4438 9.22715C12.1969 9.07935 11.9163 9.00101 11.6304 9.00001C11.3445 8.99901 11.0634 9.07541 10.8155 9.22148C10.5676 9.36754 10.3616 9.57812 10.2185 9.83193Z" fill="white"/>
  </g>
  <defs><clipPath id="wla-logo-clip-story"><rect width="32" height="32" rx="6" fill="white"/></clipPath></defs>
</svg>`;

const barStyles = html`
  <style>
    /* Layout only — colors/spacing/type come from tokens.css via the
       component styles and CSS custom properties, same as the real page. */
    .title-bar {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-h, 56px);
      padding: 0 var(--space-5, 20px);
      background: var(--color-bg, #0f0f0f);
      border-bottom: 1px solid var(--color-border, #2e2e2e);
      gap: var(--space-4, 16px);
      box-sizing: border-box;
    }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .header-right { display: flex; align-items: center; gap: var(--space-3, 12px); }
    h1 {
      font-size: var(--font-size-xl, 1.25rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text, #e8e8e8);
      white-space: nowrap;
      margin: 0;
    }
    .debug-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-radius: var(--radius, 8px);
      cursor: pointer;
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: inherit;
      white-space: nowrap;
      background: var(--color-surface, #1a1a1a);
      color: #eab308;
      border: 1px solid #6b5a20;
    }
  </style>
`;

const bar = ({ count = null, showDebug = false } = {}) => html`
  ${barStyles}
  <header class="title-bar">
    <div class="header-left">
      ${logoIcon}
      <h1>Watch Later</h1>
      ${count != null ? html`<wla-chip value=${`${count} video${count !== 1 ? 's' : ''}`}></wla-chip>` : ''}
    </div>
    <div class="header-right">
      ${showDebug ? html`<button class="debug-btn">⚠ Copy debug info</button>` : ''}
      <wla-button variant="secondary" icon="settings" icon-only label="AI settings" title="AI settings"></wla-button>
    </div>
  </header>
`;

export const Default = {
  name: 'Default (loaded)',
  render: () => bar({ count: 47 }),
};

export const Initial = {
  name: 'Initial (no count yet)',
  render: () => bar(),
};

export const Empty = {
  name: 'Empty list',
  render: () => bar({ count: 0 }),
};

export const WithDebugButton = {
  name: 'After a fetch error',
  parameters: { docs: { description: { story: 'The debug button appears in the header only once a fetch/parse error has occurred, so its data can be copied for a bug report.' } } },
  render: () => bar({ count: 47, showDebug: true }),
};
