import { LitElement, html, css } from 'lit';
import './wla-chip.js';

/**
 * Single takeaway row: optional timestamp chip → body text → inline tag.
 * @attr {number}  ts    - seek position in seconds (omit to hide the chip)
 * @attr {string}  point - the takeaway text
 * @attr {string}  label - 'worth watching' shows the amber tag; anything else is suppressed
 * @fires wla-seek        - { detail: { seconds } }
 */
export class WlaTakeaway extends LitElement {
  static properties = {
    ts:    { type: Number },
    point: { type: String },
    label: { type: String },
  };

  constructor() {
    super();
    this.ts    = null;
    this.point = '';
    this.label = '';
  }

  static styles = css`
    :host {
      display: flex;
      align-items: baseline;
      gap: var(--space-2, 8px);
      padding: 6px var(--space-2, 8px);
      border-radius: var(--radius, 8px);
      font-size: var(--font-size-base, 0.875rem);
      line-height: var(--line-height-base, 1.45);
      color: var(--color-text, #e8e8e8);
      transition: background var(--transition-fast, 0.12s);
      cursor: pointer;
    }
    :host(:hover) { background: var(--color-surface-hover, #222); }

    /* Timestamp chip */
    .ts-chip {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border: none;
      border-radius: var(--radius-sm, 4px);
      background: var(--color-accent-subtle, rgba(40,173,160,0.08));
      color: var(--color-accent, #28ada0);
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: inherit;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      transition: background var(--transition-fast, 0.12s),
                  color     var(--transition-fast, 0.12s);
    }
    /* Hover on the chip directly OR on the parent host */
    .ts-chip:hover,
    :host(:hover) .ts-chip {
      background: var(--color-accent-subtle-hover, rgba(40, 173, 160, 0.22));
      color: var(--color-accent-hover, #3dccbe);
    }
    .ts-chip:focus-visible {
      outline: 2px solid var(--color-info, #9fc1ff);
      outline-offset: 2px;
    }

    /* Play icon inside chip */
    .ts-icon {
      flex-shrink: 0;
      display: flex;
      visibility: hidden;
      line-height: 1;
    }
    .ts-time {
      transform: translateX(-7px);
      transition: transform var(--transition-fast, 0.12s);
    }
    .ts-chip:hover .ts-icon,
    :host(:hover) .ts-chip .ts-icon { visibility: visible; }
    .ts-chip:hover .ts-time,
    :host(:hover) .ts-chip .ts-time { transform: translateX(0); }

    /* Body text — inline so the tag flows naturally after the last word */
    .body { flex: 1; }

    /* Worth watching chip — sits inline after the body text */
    wla-chip { vertical-align: middle; margin-left: 4px; }
  `;

  _fmt(sec) {
    const s = Math.round(sec);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const ss = String(s % 60).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }

  _onSeek() {
    this.dispatchEvent(new CustomEvent('wla-seek', {
      detail: { seconds: this.ts },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const chip = (this.ts != null && !isNaN(this.ts)) ? html`
      <button class="ts-chip" part="ts-chip" @click=${this._onSeek}>
        <span class="ts-icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="currentColor" width="9" height="9">
            <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>
          </svg>
        </span>
        <span class="ts-time">${this._fmt(this.ts)}</span>
      </button>` : '';

    const tag = this.label === 'worth watching' ? html`
      <wla-chip state="warning" value="worth watching" part="tag"></wla-chip>` : '';

    return html`
      ${chip}
      <span class="body" part="body">${this.point}${tag}</span>
    `;
  }
}

customElements.define('wla-takeaway', WlaTakeaway);
