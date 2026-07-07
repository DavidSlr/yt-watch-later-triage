import { html } from 'lit';

export default {
  title: 'Patterns/Title Bar',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { story: { height: '72px' } },
  },
};

const refreshIcon = html`<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;

const settingsIcon = html`<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.484.484 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.61 3.61 0 0 1 8.4 12c0-1.98 1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`;

const logoIcon = html`<svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26" style="color:var(--color-accent,#ff0000);flex-shrink:0" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>`;

const barStyles = html`
  <style>
    .title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-h, 56px);
      padding: 0 20px;
      background: var(--color-bg, #0f0f0f);
      border-bottom: 1px solid var(--color-border, #2e2e2e);
      gap: 16px;
      box-sizing: border-box;
    }
    .bar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bar-title {
      font-size: var(--font-size-xl, 1.25rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text, #e8e8e8);
      white-space: nowrap;
    }
    .count-badge {
      background: var(--color-surface, #1a1a1a);
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: 99px;
      padding: 2px 10px;
      font-size: var(--font-size-base, 0.875rem);
      color: var(--color-text-muted, #aaa);
      white-space: nowrap;
    }
    .bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sync-status {
      font-size: var(--font-size-base, 0.875rem);
      color: var(--color-text-muted, #aaa);
      white-space: nowrap;
    }
    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 14px;
      border-radius: var(--radius, 8px);
      cursor: pointer;
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      white-space: nowrap;
      border: none;
      transition: background var(--transition-fast, 0.12s);
    }
    .btn-primary {
      background: var(--color-accent, #ff0000);
      color: #fff;
    }
    .btn-primary:hover { background: var(--color-accent-hover, #cc0000); }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-secondary {
      background: var(--color-surface, #1a1a1a);
      color: var(--color-text, #e8e8e8);
      border: 1px solid var(--color-border, #2e2e2e);
    }
    .btn-secondary:hover { background: var(--color-surface-hover, #222); }
    .btn-icon {
      padding: 7px 10px;
    }
  </style>
`;

const bar = ({ count = null, syncStatus = null, refreshDisabled = false } = {}) => html`
  ${barStyles}
  <header class="title-bar">
    <div class="bar-left">
      ${logoIcon}
      <span class="bar-title">Watch Later</span>
      ${count != null ? html`<span class="count-badge">${count} videos</span>` : ''}
    </div>
    <div class="bar-right">
      ${syncStatus ? html`<span class="sync-status">${syncStatus}</span>` : ''}
      <button class="btn-primary" ?disabled=${refreshDisabled}>
        ${refreshIcon} Refresh
      </button>
      <button class="btn-secondary btn-icon" title="AI settings">
        ${settingsIcon}
      </button>
    </div>
  </header>
`;

export const Default = {
  name: 'Default (loaded)',
  render: () => bar({ count: 47 }),
};

export const Loading = {
  name: 'Loading',
  render: () => bar({ syncStatus: 'Loading…', refreshDisabled: true }),
};

export const Syncing = {
  name: 'Syncing',
  render: () => bar({ count: 47, syncStatus: 'Syncing 12 / 47…' }),
};

export const Empty = {
  name: 'Empty list',
  render: () => bar({ count: 0 }),
};

export const NoCount = {
  name: 'Initial (no count yet)',
  render: () => bar(),
};
