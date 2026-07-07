import { LitElement, html, css } from 'lit';

/**
 * Tabbed interface with underline indicator.
 * @attr  {string} active - id of the currently active tab
 * @prop  {Array}  tabs   - [{ id: string, label: string }]
 * @slot  One slot per tab, identified by name matching the tab id
 * @fires wla-tab-change - { detail: { tab: string } }
 */
export class WlaTabs extends LitElement {
  static properties = {
    tabs:   { type: Array },
    active: { type: String, reflect: true },
  };

  constructor() {
    super();
    this.tabs = [];
    this.active = '';
  }

  static styles = css`
    :host { display: flex; flex-direction: column; overflow: hidden; }

    .tab-bar {
      display: flex;
      border-bottom: 1px solid var(--color-border, #2e2e2e);
      padding: 0 var(--space-4, 18px);
      gap: var(--space-1, 4px);
      flex-shrink: 0;
    }

    button {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--color-text-muted, #aaa);
      font-size: var(--font-size-base, 0.875rem);
      font-weight: 500;
      font-family: inherit;
      padding: 8px 12px;
      cursor: pointer;
      margin-bottom: -1px;
      transition: color var(--transition-fast, 0.12s),
                  border-color var(--transition-fast, 0.12s);
    }
    button:hover:not(.active) { color: var(--color-text, #e8e8e8); }
    button.active {
      color: var(--color-text, #e8e8e8);
      border-bottom-color: var(--color-info, #9fc1ff);
    }
    button:focus-visible {
      outline: 2px solid var(--color-info, #9fc1ff);
      outline-offset: -2px;
    }

    .panels {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    ::slotted(*) {
      display: none;
      height: 100%;
      overflow: auto;
      padding: var(--space-3, 14px) var(--space-4, 18px);
    }
    ::slotted(.active) { display: block; }
  `;

  _select(id) {
    this.active = id;
    this.dispatchEvent(new CustomEvent('wla-tab-change', { detail: { tab: id }, bubbles: true, composed: true }));
  }

  _onKeyDown(e) {
    const buttons = Array.from(this.shadowRoot.querySelectorAll('button[role="tab"]'));
    const idx = buttons.indexOf(e.target);
    if (idx === -1) return;
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    if (next !== -1) {
      e.preventDefault();
      buttons[next].focus();
      this._select(this.tabs[next].id);
    }
  }

  willUpdate(changed) {
    if ((changed.has('tabs') || changed.has('active')) && this.tabs.length && !this.active) {
      this.active = this.tabs[0].id;
    }
  }

  updated() {
    this.shadowRoot.querySelectorAll('slot[name]').forEach(slot => {
      slot.assignedElements().forEach(el => {
        el.classList.toggle('active', slot.name === this.active);
      });
    });
  }

  render() {
    return html`
      <div class="tab-bar" part="tab-bar" role="tablist" @keydown=${this._onKeyDown}>
        ${this.tabs.map(t => html`
          <button
            part="tab"
            role="tab"
            aria-selected=${t.id === this.active}
            class=${t.id === this.active ? 'active' : ''}
            @click=${() => this._select(t.id)}
          >${t.label}</button>
        `)}
      </div>
      <div class="panels" part="panels">
        ${this.tabs.map(t => html`<slot name=${t.id}></slot>`)}
      </div>
    `;
  }
}

customElements.define('wla-tabs', WlaTabs);
