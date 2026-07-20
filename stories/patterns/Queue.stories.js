import { html } from 'lit';
import '../../components/wla-queue-card.js';
import '../../components/wla-button.js';

export default {
  title: 'Patterns/Queue',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'The bottom queue bar from `pages/watchlater.html` — composes [`wla-queue-card`](?path=/story/components-queuecard--default) for each video, plus real [`wla-button`](?path=/story/components-button--default) instances for refresh and prev/next. The whole header row is a collapse toggle (`role="button"`, keyboard-operable), and the chevron is a centered decoration, not a separate control.' } },
  },
};

// Placeholder thumbnail — dark grey box, no external dependency
const THUMB = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 99"><rect width="176" height="99" fill="#1a1a1a"/></svg>'
)}`;

const VIDEOS = [
  { title: 'Building a Design System with Lit & Storybook',         channel: 'Google Chrome Developers', duration: '28:14', date: '2 weeks ago',  active: true  },
  { title: 'CSS Custom Properties Deep Dive',                        channel: 'Kevin Powell',              duration: '18:05', date: '1 month ago', active: false },
  { title: 'Web Components in 2025 — What Changed?',                 channel: 'Theo',                     duration: '32:47', date: '3 days ago',  active: false },
  { title: 'The Performance Gap: Native vs Framework',               channel: 'Fireship',                 duration: '9:51',  date: '5 days ago',  active: false },
  { title: 'Shadow DOM Explained Once and For All',                  channel: 'Jack Herrington',          duration: '22:18', date: '2 months ago',active: false },
  { title: 'From Figma to Web Components — a realistic workflow',    channel: 'DesignCode',               duration: '41:03', date: '1 week ago',  active: false },
  { title: 'TypeScript Generics Are Not That Hard',                  channel: 'Matt Pocock',              duration: '15:29', date: '4 days ago',  active: false },
];

const chevronDouble = html`<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
  <path d="M12 15.5 6 9.5l1.41-1.41L12 12.67l4.59-4.58L18 9.5z"/>
  <path d="M12 21 6 15l1.41-1.41L12 18.17l4.59-4.58L18 15z"/>
</svg>`;

const queueStyles = html`
  <style>
    /* Layout only — colors/spacing/type come from tokens.css, same as the
       real page (pages/watchlater.css). */
    .queue-shell {
      height: 260px;
      display: flex;
      flex-direction: column;
      background: var(--color-bg, #0f0f0f);
      border-top: 1px solid var(--color-border, #2e2e2e);
      overflow: hidden;
    }
    .queue-shell.collapsed { height: auto; }
    .queue-shell.collapsed .queue-scroll { display: none; }
    .queue-shell.collapsed .queue-collapse-icon { transform: translate(-50%, -50%) rotate(180deg); }

    .queue-header {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      padding: 5px var(--space-4, 16px) 4px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--color-border, #2e2e2e);
      cursor: pointer;
    }
    .queue-title-left { display: flex; align-items: center; gap: var(--space-2, 8px); }
    .queue-label {
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-muted, #aaa);
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .queue-count {
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--color-text-tertiary, #777);
    }
    .queue-sync { display: flex; align-items: center; gap: var(--space-2, 8px); }
    .sync-status {
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--color-text-tertiary, #777);
      white-space: nowrap;
    }
    /* Vertical divider between the count and the refresh/sync group */
    .queue-title-sep {
      width: 1px;
      height: 16px;
      flex-shrink: 0;
      background: var(--color-border, #2e2e2e);
      margin: 0 var(--space-3, 12px);
    }

    /* Purely decorative — pinned to the true bar center regardless of how
       wide the left/right groups are. The whole header row is the click
       target for collapse, not this icon specifically. */
    .queue-collapse-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      color: var(--color-text, #e8e8e8);
      pointer-events: none;
      transition: color var(--transition-fast, 0.12s), transform var(--transition-base, 0.2s);
    }
    .queue-header:hover .queue-collapse-icon { color: var(--color-accent, #28ada0); }

    .queue-nav { display: flex; gap: var(--space-1, 4px); margin-left: auto; }

    .queue-scroll {
      flex: 1;
      display: flex;
      gap: var(--space-2, 8px);
      padding: var(--space-2, 8px) 14px;
      overflow-x: auto;
      overflow-y: hidden;
      align-items: stretch;
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }

    .queue-load-more-card { width: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .queue-load-more-btn {
      width: 100%;
      height: 100%;
      background: var(--color-surface, #1a1a1a);
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: var(--radius-sm, 4px);
      color: var(--color-text-muted, #aaa);
      font-size: var(--font-size-sm, 0.75rem);
      cursor: pointer;
      padding: var(--space-2, 8px) var(--space-1, 4px);
      text-align: center;
    }
  </style>
`;

const queue = ({ videos = VIDEOS, collapsed = false, prevDisabled = true, syncStatus = null, showLoadMore = false } = {}) => html`
  ${queueStyles}
  <div class="queue-shell${collapsed ? ' collapsed' : ''}">
    <div class="queue-header" role="button" tabindex="0" aria-expanded=${!collapsed} aria-label="Toggle queue visibility">
      <div class="queue-title-left">
        <span class="queue-label">Queue</span>
        <span class="queue-count">${videos.length}</span>
        <div class="queue-title-sep" aria-hidden="true"></div>
        <div class="queue-sync">
          <wla-button variant="secondary" size="sm" icon="refresh" title="Reload your Watch Later list">Refresh</wla-button>
          ${syncStatus ? html`<span class="sync-status">${syncStatus}</span>` : ''}
        </div>
      </div>

      <span class="queue-collapse-icon" aria-hidden="true">${chevronDouble}</span>

      <div class="queue-nav">
        <wla-button variant="secondary" size="sm" icon-only icon="arrow-left" label="Scroll left" ?disabled=${prevDisabled}></wla-button>
        <wla-button variant="secondary" size="sm" icon-only icon="arrow-right" label="Scroll right"></wla-button>
      </div>
    </div>
    <div class="queue-scroll">
      ${videos.map(v => html`
        <wla-queue-card
          thumbnail=${THUMB}
          title=${v.title}
          channel=${v.channel}
          duration=${v.duration}
          date=${v.date}
          ?active=${v.active}
        ></wla-queue-card>
      `)}
      ${showLoadMore ? html`
        <div class="queue-load-more-card">
          <button class="queue-load-more-btn">Load more…</button>
        </div>
      ` : ''}
    </div>
  </div>
`;

export const Default = {
  parameters: { docs: { story: { height: '300px' } } },
  render: () => queue(),
};

export const Syncing = {
  name: 'Syncing',
  parameters: { docs: { story: { height: '300px' } } },
  render: () => queue({ syncStatus: 'Syncing 12 / 47…' }),
};

export const Synced = {
  name: 'Synced (relative time)',
  parameters: { docs: { story: { height: '300px' } } },
  render: () => queue({ syncStatus: 'Synced 2 minutes ago' }),
};

export const Scrolled = {
  name: 'Scrolled (prev enabled)',
  parameters: { docs: { story: { height: '300px' } } },
  render: () => queue({ prevDisabled: false }),
};

export const Collapsed = {
  parameters: { docs: { story: { height: '80px' } } },
  render: () => queue({ collapsed: true }),
};

export const ShortQueue = {
  name: 'Short queue (3 items)',
  parameters: { docs: { story: { height: '300px' } } },
  render: () => queue({ videos: VIDEOS.slice(0, 3) }),
};

export const WithLoadMore = {
  name: 'With "Load more" (pagination continuation)',
  parameters: { docs: { story: { height: '300px' } } },
  render: () => queue({ showLoadMore: true }),
};
