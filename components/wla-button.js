import { LitElement, html, css, svg } from 'lit';

const ICONS = {
  refresh:       svg`<path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>`,
  settings:      svg`<path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.484.484 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.61 3.61 0 0 1 8.4 12c0-1.98 1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>`,
  close:         svg`<path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>`,
  play:          svg`<path d="M8 5v14l11-7z"/>`,
  'arrow-left':  svg`<path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>`,
  'arrow-right': svg`<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>`,
};

/**
 * General-purpose button / link.
 * @attr {'primary'|'secondary'|'link'} variant
 * @attr {boolean} disabled
 * @attr {string}  href  - renders an <a> instead of <button>
 * @attr {string}  icon  - optional built-in icon: refresh | settings | close | play | arrow-left | arrow-right
 */
export class WlaButton extends LitElement {
  static properties = {
    variant:  { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    href:     { type: String },
    icon:     { type: String },
  };

  constructor() {
    super();
    this.variant = 'primary';
    this.disabled = false;
    this.icon = '';
  }

  static styles = css`
    :host { display: inline-block; }

    button, a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: var(--radius, 8px);
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
      white-space: nowrap;
      transition: background var(--transition-fast, 0.12s),
                  border-color var(--transition-fast, 0.12s),
                  color var(--transition-fast, 0.12s),
                  opacity var(--transition-fast, 0.12s);
    }

    /* ── Primary ──────────────────────────────────────────────── */
    :host([variant='primary']) button,
    :host([variant='primary']) a {
      background: var(--color-accent-solid, #1b7e74);
      color: #fff;
    }
    :host([variant='primary']) button:hover,
    :host([variant='primary']) a:hover {
      background: var(--color-accent-solid-hover, #176d65);
    }

    /* ── Secondary ────────────────────────────────────────────── */
    :host([variant='secondary']) button,
    :host([variant='secondary']) a {
      background: var(--color-surface, #1a1a1a);
      color: var(--color-text, #e8e8e8);
      border-color: var(--color-border, #2e2e2e);
    }
    :host([variant='secondary']) button:hover,
    :host([variant='secondary']) a:hover {
      background: var(--color-surface-hover, #222);
    }

    /* ── Link ─────────────────────────────────────────────────── */
    :host([variant='link']) button,
    :host([variant='link']) a {
      background: transparent;
      color: var(--color-info, #9fc1ff);
      border-color: transparent;
      padding-left: 2px;
      padding-right: 2px;
    }
    :host([variant='link']) button:hover,
    :host([variant='link']) a:hover {
      color: var(--color-info, #9fc1ff);
      text-decoration: underline;
    }

    /* ── Disabled ─────────────────────────────────────────────── */
    button:focus-visible,
    a:focus-visible {
      outline: 2px solid var(--color-info, #9fc1ff);
      outline-offset: 2px;
    }

    :host([disabled]) button,
    :host([disabled]) a {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ── Icons ────────────────────────────────────────────────── */
    .icon {
      display: flex;
      flex-shrink: 0;
    }
    ::slotted(svg) { width: 15px; height: 15px; flex-shrink: 0; }
  `;

  _icon() {
    const path = ICONS[this.icon];
    if (!path) return '';
    return html`
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">${path}</svg>
      </span>
    `;
  }

  render() {
    const inner = html`${this._icon()}<slot></slot>`;
    if (this.href) {
      return html`<a href=${this.href} part="button">${inner}</a>`;
    }
    return html`<button ?disabled=${this.disabled} part="button">${inner}</button>`;
  }
}

customElements.define('wla-button', WlaButton);
