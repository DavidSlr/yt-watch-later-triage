import { html } from 'lit';
import '../../components/wla-queue-card.js';

export default {
  title: 'Patterns/Queue',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Composes [`wla-queue-card`](?path=/story/components-queuecard--default) for each video item in the scrollable row.' } },
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

const arrowLeft  = html`<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
const arrowRight = html`<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
const arrowUp    = html`<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`;

const queueStyles = html`
  <style>
    .queue-shell {
      height: 260px;
      display: flex;
      flex-direction: column;
      background: #111;
      border-top: 1px solid var(--color-border, #2e2e2e);
      overflow: hidden;
    }
    .queue-shell.collapsed { height: auto; }
    .queue-shell.collapsed .queue-scroll { display: none; }
    .queue-shell.collapsed .collapse-icon { transform: rotate(180deg); }

    .queue-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 16px 4px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--color-border, #2e2e2e);
      user-select: none;
    }
    .queue-label {
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text-muted, #aaa);
      text-transform: uppercase;
      letter-spacing: 0.07em;
    }
    .queue-count {
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--color-text-disabled, #555);
    }
    .queue-nav { display: flex; gap: 4px; margin-left: auto; }

    .queue-nav-btn, .queue-collapse-btn {
      width: 26px; height: 26px;
      border-radius: var(--radius-sm, 4px);
      color: var(--color-text-muted, #aaa);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      padding: 0;
      transition: border-color var(--transition-fast, 0.12s),
                  color var(--transition-fast, 0.12s);
    }
    .queue-nav-btn {
      background: var(--color-surface, #1a1a1a);
      border: 1px solid var(--color-border, #2e2e2e);
    }
    .queue-nav-btn:hover:not(:disabled) { border-color: #444; color: var(--color-text, #e8e8e8); }
    .queue-nav-btn:disabled { opacity: 0.3; cursor: default; }

    .queue-collapse-btn {
      background: transparent;
      border: none;
      margin-left: 4px;
    }
    .queue-collapse-btn:hover { color: var(--color-text, #e8e8e8); }
    .collapse-icon { transition: transform 0.2s; display: flex; }

    .queue-scroll {
      flex: 1;
      display: flex;
      gap: 8px;
      padding: 8px 14px;
      overflow-x: auto;
      overflow-y: hidden;
      align-items: stretch;
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }
  </style>
`;

const queue = ({ videos = VIDEOS, collapsed = false, prevDisabled = true } = {}) => html`
  ${queueStyles}
  <div class="queue-shell${collapsed ? ' collapsed' : ''}">
    <div class="queue-header">
      <span class="queue-label">Queue</span>
      <span class="queue-count">${videos.length}</span>
      <div class="queue-nav">
        <button class="queue-nav-btn" aria-label="Scroll left" ?disabled=${prevDisabled}>${arrowLeft}</button>
        <button class="queue-nav-btn" aria-label="Scroll right">${arrowRight}</button>
      </div>
      <button class="queue-collapse-btn" aria-label="Toggle queue">
        <span class="collapse-icon">${arrowUp}</span>
      </button>
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
    </div>
  </div>
`;

export const Default = {
  parameters: { docs: { story: { height: '300px' } } },
  render: () => queue(),
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
