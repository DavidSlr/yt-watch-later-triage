import { LitElement, html, css } from 'lit';

/**
 * Clickable timestamp button. Shows a play icon on hover.
 * @attr {number} seconds - time in seconds (used for the seek event)
 * @attr {string} label   - formatted display string (auto-derived from seconds if omitted)
 * @fires wla-seek        - { detail: { seconds } }
 */
export class WlaTimestamp extends LitElement {
  static properties = {
    seconds: { type: Number },
    label:   { type: String },
  };

  constructor() {
    super();
    this.seconds = 0;
    this.label = '';
  }

  static styles = css`
    :host { display: inline-block; }

    button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border: none;
      border-radius: var(--radius-sm, 4px);
      background: var(--color-accent-subtle, rgba(40,173,160,0.08));
      color: var(--color-accent, #28ada0);
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: inherit;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      cursor: pointer;
      transition: background var(--transition-fast, 0.12s),
                  color var(--transition-fast, 0.12s);
    }

    button:hover {
      background: rgba(40, 173, 160, 0.22);
      color: var(--color-accent-hover, #3dccbe);
    }
    button:focus-visible {
      outline: 2px solid var(--color-info, #9fc1ff);
      outline-offset: 2px;
    }

    /* icon is always in flow (preserves button width) but hidden at rest */
    .icon {
      flex-shrink: 0;
      display: flex;
      visibility: hidden;
      line-height: 1;
    }
    button:hover .icon { visibility: visible; }

    /* shift text left by half the icon+gap (7px) so it appears centered at rest;
       snap back on hover so icon and text sit side by side */
    .time {
      transform: translateX(-7px);
      transition: transform var(--transition-fast, 0.12s);
    }
    button:hover .time { transform: translateX(0); }
  `;

  _fmt(sec) {
    const s = Math.round(sec);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const ss = String(s % 60).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
  }

  _onClick() {
    this.dispatchEvent(new CustomEvent('wla-seek', {
      detail: { seconds: this.seconds },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    const display = this.label || this._fmt(this.seconds);
    return html`
      <button part="button" @click=${this._onClick}>
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10">
            <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>
          </svg>
        </span>
        <span class="time">${display}</span>
      </button>
    `;
  }
}

customElements.define('wla-timestamp', WlaTimestamp);
