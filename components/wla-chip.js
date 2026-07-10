import { LitElement, html, css } from 'lit';

/**
 * Semantic status / tag chip.
 * @attr {string} value - text shown inside the pill
 * @attr {string} state - neutral | success | warning | critical | disabled
 * @attr {string} label - optional caption rendered to the left of the pill
 */
export class WlaChip extends LitElement {
  static properties = {
    value: { type: String },
    state: { type: String, reflect: true },
    label: { type: String },
  };

  constructor() {
    super();
    this.value = '';
    this.state = 'neutral';
    this.label = '';
  }

  static styles = css`
    :host { display: inline-flex; align-items: center; gap: var(--space-2, 8px); }
    :host([state='disabled']) { pointer-events: none; }

    .label {
      font-size: var(--font-size-base, 0.875rem);
      color: var(--color-text-muted, #aaa);
      white-space: nowrap;
    }

    .pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      white-space: nowrap;
      background: var(--color-surface-raised, #242424);
      color: var(--color-text-muted, #aaa);
      border: 1px solid var(--color-border, #2e2e2e);
    }

    :host([state='success'])  .pill { background: var(--color-success-bg, rgba(40,173,160,0.08)); color: var(--color-success, #28ada0); border-color: transparent; }
    :host([state='warning'])  .pill { background: var(--color-warning-bg, rgba(212,150,30,0.15)); color: var(--color-warning, #d4963a); border-color: transparent; }
    :host([state='critical']) .pill { background: var(--color-critical-bg, #2e1314); color: var(--color-critical, #e5484d); border-color: transparent; }
    :host([state='disabled']) .pill { background: var(--color-surface,    #1a1a1a); color: var(--color-text-disabled, #555); border-color: var(--color-border, #2e2e2e); opacity: 0.6; }
  `;

  render() {
    return html`
      ${this.label ? html`<span class="label" part="label">${this.label}</span>` : ''}
      <span class="pill" part="pill">${this.value}</span>
    `;
  }
}

customElements.define('wla-chip', WlaChip);
