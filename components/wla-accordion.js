import { LitElement, html, css } from 'lit';

/**
 * Single expandable accordion section.
 * @attr {string}  title
 * @attr {boolean} open
 * @slot default - body content
 * @fires wla-toggle
 */
export class WlaAccordion extends LitElement {
  static properties = {
    title: { type: String },
    open:  { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.title = '';
    this.open = false;
  }

  static styles = css`
    :host { display: block; border-bottom: 1px solid var(--color-border, #2e2e2e); }

    button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0 var(--space-4, 16px);
      height: 44px;
      background: var(--color-surface, #1a1a1a);
      border: none;
      color: var(--color-text-muted, #aaa);
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: background var(--transition-fast, 0.12s), color var(--transition-fast, 0.12s);
    }
    button:hover { background: var(--color-surface-hover, #222); color: var(--color-text, #e8e8e8); }
    button:focus-visible { outline: 2px solid var(--color-info, #9fc1ff); outline-offset: -2px; }
    :host([open]) button { color: var(--color-text, #e8e8e8); }

    /* Inside wla-accordion-group the group renders its own sticky headers */
    :host([in-group]) { border-bottom: none; }
    :host([in-group]) button { display: none; }

    .title { flex: 1; }

    svg {
      transition: transform var(--transition-base, 0.2s);
      opacity: 0.5;
      flex-shrink: 0;
    }
    :host([open]) svg { transform: rotate(90deg); opacity: 0.8; }

    .body {
      display: none;
      padding: var(--space-3, 12px) var(--space-4, 16px);
    }
    :host([open]) .body { display: block; }
  `;

  _toggle() {
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent('wla-toggle', { detail: { open: this.open }, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <button part="header" @click=${this._toggle} aria-expanded=${this.open}>
        <span class="title">${this.title}</span>
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      <div class="body" part="body"><slot></slot></div>
    `;
  }
}

customElements.define('wla-accordion', WlaAccordion);
