import { LitElement, html, css } from 'lit';

/**
 * Radio selection card (e.g. AI provider choice).
 * Cards with the same `name` form an exclusive group — selecting one unchecks the others.
 * @attr {string}  name     - radio group name
 * @attr {string}  value
 * @attr {boolean} checked
 * @attr {string}  label    - primary label
 * @attr {string}  sublabel - secondary line (pricing / tier info)
 * @fires wla-change - { value }
 */
export class WlaRadioCard extends LitElement {
  static properties = {
    name:     { type: String },
    value:    { type: String },
    checked:  { type: Boolean, reflect: true },
    label:    { type: String },
    sublabel: { type: String },
  };

  constructor() {
    super();
    this.name = '';
    this.value = '';
    this.checked = false;
    this.label = '';
    this.sublabel = '';
  }

  static styles = css`
    :host { display: block; }

    label {
      display: flex;
      align-items: center;
      gap: var(--space-3, 12px);
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: var(--radius, 8px);
      background: var(--color-surface, #1a1a1a);
      cursor: pointer;
      height: 100%;
      box-sizing: border-box;
      transition: border-color var(--transition-fast, 0.12s),
                  background var(--transition-fast, 0.12s);
    }
    label:hover { border-color: var(--color-border-hover, #444); background: var(--color-surface-hover, #222); }
    label:focus-within {
      outline: 2px solid var(--color-info, #9fc1ff);
      outline-offset: 2px;
    }
    :host([checked]) label { border-color: var(--color-accent, #28ada0); background: var(--color-accent-subtle, rgba(40,173,160,0.08)); }

    input[type='radio'] {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid var(--color-border, #2e2e2e);
      background: transparent;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color var(--transition-fast, 0.12s);
    }
    :host([checked]) .dot { border-color: var(--color-accent, #28ada0); }
    :host([checked]) .dot::after {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-accent, #28ada0);
    }

    .text { flex: 1; min-width: 0; }
    .name {
      display: block;
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #e8e8e8);
    }
    .sub {
      display: block;
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--color-text-muted, #aaa);
      margin-top: 2px;
    }
  `;

  _onChange() {
    this.checked = true;
    this.getRootNode().querySelectorAll(`wla-radio-card[name="${CSS.escape(this.name)}"]`).forEach(card => {
      if (card !== this) card.checked = false;
    });
    this.dispatchEvent(new CustomEvent('wla-change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <label part="card">
        <input type="radio" name=${this.name} .value=${this.value} .checked=${this.checked} @change=${this._onChange} />
        <span class="dot" part="dot"></span>
        <span class="text">
          <span class="name">${this.label}</span>
          ${this.sublabel ? html`<span class="sub">${this.sublabel}</span>` : ''}
        </span>
      </label>
    `;
  }
}

customElements.define('wla-radio-card', WlaRadioCard);
