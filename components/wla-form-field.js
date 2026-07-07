import { LitElement, html, css } from 'lit';

/**
 * Labeled form input. Password type gets a built-in show/hide toggle.
 * @attr {string} label
 * @attr {string} hint
 * @attr {string} type        - text | password | url
 * @attr {string} placeholder
 * @attr {string} value
 * @attr {string} state       - default | readonly | disabled
 * @fires wla-change - { value }
 */
export class WlaFormField extends LitElement {
  static properties = {
    label:       { type: String },
    hint:        { type: String },
    type:        { type: String },
    placeholder: { type: String },
    value:       { type: String },
    state:       { type: String, reflect: true },
    _show:       { state: true },
  };

  constructor() {
    super();
    this.label = '';
    this.hint = '';
    this.type = 'text';
    this.placeholder = '';
    this.value = '';
    this.state = 'default';
    this._show = false;
  }

  static styles = css`
    :host { display: block; }

    label {
      display: block;
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-muted, #aaa);
      margin-bottom: var(--space-1, 4px);
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    input {
      flex: 1;
      width: 100%;
      padding: 7px var(--space-3, 12px);
      background: var(--color-bg, #0f0f0f);
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: var(--radius-sm, 4px);
      color: var(--color-text, #e8e8e8);
      font-size: var(--font-size-base, 0.875rem);
      font-family: inherit;
      transition: border-color var(--transition-fast, 0.12s);
    }
    input:focus {
      outline: none;
      border-color: var(--color-border-focus, #4a5a75);
    }
    input::placeholder { color: var(--color-text-disabled, #555); }

    input.has-toggle { padding-right: 36px; }

    :host([state='readonly']) input {
      background: var(--color-surface, #1a1a1a);
      color: var(--color-text-muted, #aaa);
      cursor: default;
    }
    :host([state='readonly']) input:focus { border-color: var(--color-border, #2e2e2e); }

    :host([state='disabled']) input {
      opacity: 0.4;
      cursor: not-allowed;
    }
    :host([state='disabled']) .toggle { pointer-events: none; opacity: 0.4; }

    .toggle {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-disabled, #555);
      transition: color var(--transition-fast, 0.12s);
      border-radius: var(--radius-sm, 4px);
    }
    .toggle:hover { color: var(--color-text-muted, #aaa); }

    .hint {
      margin-top: var(--space-1, 4px);
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--color-text-disabled, #555);
      line-height: var(--line-height-base, 1.45);
    }
    .hint ::slotted(a) { color: var(--color-info, #9fc1ff); }
  `;

  _onChange(e) {
    this.value = e.target.value;
    this.dispatchEvent(new CustomEvent('wla-change', { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  _toggleShow(e) {
    e.preventDefault();
    this._show = !this._show;
  }

  _eyeOpen() {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `;
  }

  _eyeOff() {
    return html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    `;
  }

  render() {
    const inputId = `wla-field-${Math.random().toString(36).slice(2, 7)}`;
    const isPassword = this.type === 'password';
    const resolvedType = isPassword ? (this._show ? 'text' : 'password') : this.type;
    const isDisabled = this.state === 'disabled';
    const isReadonly = this.state === 'readonly';

    return html`
      ${this.label ? html`<label for=${inputId} part="label">${this.label}</label>` : ''}
      <div class="input-wrap">
        <input
          id=${inputId}
          part="input"
          class=${isPassword ? 'has-toggle' : ''}
          type=${resolvedType}
          placeholder=${this.placeholder}
          .value=${this.value}
          ?disabled=${isDisabled}
          ?readonly=${isReadonly}
          @input=${this._onChange}
          autocomplete="off"
        />
        ${isPassword ? html`
          <button
            class="toggle"
            part="toggle"
            type="button"
            aria-label=${this._show ? 'Hide password' : 'Show password'}
            @click=${this._toggleShow}
          >${this._show ? this._eyeOff() : this._eyeOpen()}</button>
        ` : ''}
      </div>
      ${this.hint ? html`<p class="hint" part="hint">${this.hint}<slot name="hint-links"></slot></p>` : ''}
    `;
  }
}

customElements.define('wla-form-field', WlaFormField);
