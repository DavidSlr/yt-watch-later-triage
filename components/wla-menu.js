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
    this._onKeyDown = this._onKeyDown.bind(this);
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
    .trigger:focus-visible {
      outline: 2px solid var(--color-info, #9fc1ff);
      outline-offset: 2px;
    }

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
      padding: 8px 12px;
      background: transparent;
      border: none;
      border-left: 2px solid transparent;
      color: var(--color-text, #e8e8e8);
      font-size: var(--font-size-base, 0.875rem);
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      text-decoration: none;
      transition: background var(--transition-fast, 0.12s),
                  border-color var(--transition-fast, 0.12s);
    }
    ::slotted(button):focus-visible,
    ::slotted(a):focus-visible {
      outline: 2px solid var(--color-info, #9fc1ff);
      outline-offset: -2px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
    this.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
    this.removeEventListener('keydown', this._onKeyDown);
  }

  _onDocClick(e) {
    if (this.open && !this.contains(e.target)) {
      this.open = false;
      this.dispatchEvent(new CustomEvent('wla-menu-close', { bubbles: true, composed: true }));
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape' && this.open) {
      e.stopPropagation();
      this.open = false;
      this.dispatchEvent(new CustomEvent('wla-menu-close', { bubbles: true, composed: true }));
      this.shadowRoot.querySelector('.trigger')?.focus();
    }
  }

  updated(changed) {
    if (!changed.has('open')) return;
    const dropdown = this.shadowRoot?.querySelector('.dropdown');
    if (!dropdown) return;
    if (!this.open) {
      // Reset inline overrides so next open starts from CSS defaults
      dropdown.style.top = dropdown.style.bottom = dropdown.style.left = dropdown.style.right = '';
      return;
    }
    // After paint, check if the dropdown overflows the viewport and flip if needed
    requestAnimationFrame(() => {
      const rect = dropdown.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        dropdown.style.top = 'auto';
        dropdown.style.bottom = 'calc(100% + 4px)';
      }
      if (rect.left < 0) {
        dropdown.style.right = 'auto';
        dropdown.style.left = '0';
      }
    });
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

  _onSlotChange(e) {
    e.target.assignedElements().forEach(el => {
      if (!el.hasAttribute('role')) el.setAttribute('role', 'menuitem');
      if (el._wlaCleanup) el._wlaCleanup();
      const onEnter = () => {
        el.style.background = 'var(--color-surface-hover, #222)';
        el.style.borderLeftColor = 'var(--color-info, #9fc1ff)';
      };
      const onLeave = () => {
        el.style.background = '';
        el.style.borderLeftColor = '';
      };
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      el._wlaCleanup = () => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      };
    });
  }

  render() {
    return html`
      <button class="trigger" part="trigger" aria-label=${this.label} aria-haspopup="menu" aria-expanded=${this.open} @click=${this._toggle}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
      <div class="dropdown" part="dropdown" role="menu" aria-orientation="vertical" @click=${this._onSlotClick}>
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
}

customElements.define('wla-menu', WlaMenu);
