import { LitElement, html, css } from 'lit';

/**
 * Kebab-menu button (⋮) with a dropdown of slotted items.
 * @attr  {boolean} open    - whether the dropdown is visible
 * @attr  {string}  label   - accessible label for the trigger (default: "More options")
 * @slot  default           - menu items; style with button or a elements
 * @fires wla-menu-open
 * @fires wla-menu-close
 */
export class WlaMenu extends LitElement {
  static properties = {
    open:  { type: Boolean, reflect: true },
    label: { type: String },
  };

  constructor() {
    super();
    this.open = false;
    this.label = 'More options';
    this._onDocClick = this._onDocClick.bind(this);
  }

  static styles = css`
    :host { display: inline-block; position: relative; }

    .trigger {
      width: 28px;
      height: 28px;
      background: transparent;
      border: none;
      border-radius: var(--radius-sm, 4px);
      color: var(--color-text-muted, #aaa);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background var(--transition-fast, 0.12s),
                  color var(--transition-fast, 0.12s);
    }
    .trigger:hover { background: var(--color-surface-hover, #222); color: var(--color-text, #e8e8e8); }

    .dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 20;
      background: var(--color-surface, #1a1a1a);
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: var(--radius-sm, 6px);
      box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.5));
      min-width: 160px;
      padding: var(--space-1, 4px) 0;
    }
    :host([open]) .dropdown { display: block; }

    ::slotted(button),
    ::slotted(a) {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      width: 100%;
      padding: 8px 14px;
      background: transparent;
      border: none;
      color: var(--color-text, #e8e8e8);
      font-size: var(--font-size-base, 0.875rem);
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      text-decoration: none;
      transition: background var(--transition-fast, 0.12s);
    }
    ::slotted(button):hover,
    ::slotted(a):hover {
      background: var(--color-surface-raised, #242424);
      color: var(--color-text, #e8e8e8);
      border-left: 2px solid var(--color-info, #9fc1ff);
      padding-left: 12px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
  }

  _onDocClick(e) {
    if (this.open && !this.contains(e.target)) {
      this.open = false;
      this.dispatchEvent(new CustomEvent('wla-menu-close', { bubbles: true, composed: true }));
    }
  }

  _toggle(e) {
    e.stopPropagation();
    this.open = !this.open;
    this.dispatchEvent(new CustomEvent(this.open ? 'wla-menu-open' : 'wla-menu-close', { bubbles: true, composed: true }));
  }

  _onSlotClick() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('wla-menu-close', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <button class="trigger" part="trigger" aria-label=${this.label} aria-haspopup="true" aria-expanded=${this.open} @click=${this._toggle}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
      <div class="dropdown" part="dropdown" @click=${this._onSlotClick}>
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('wla-menu', WlaMenu);
