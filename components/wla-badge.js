import { LitElement, html, css } from 'lit';

/**
 * Status / count badge pill.
 * @attr {string} state - online | offline | error | neutral
 * @attr {string} label - text shown inside the badge
 */
export class WlaBadge extends LitElement {
  static properties = {
    state: { type: String, reflect: true },
    label: { type: String },
  };

  constructor() {
    super();
    this.state = 'neutral';
    this.label = '';
  }

  static styles = css`
    :host { display: inline-block; }

    span {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      white-space: nowrap;
      background: var(--color-surface, #1a1a1a);
      color: var(--color-text-muted, #aaa);
    }

    :host([state='online']) span  { color: var(--color-success, #2d7a2d); background: var(--color-success-bg, #e6f4e6); }
    :host([state='offline']) span { color: var(--color-warning, #a05c00); background: var(--color-warning-bg, #fff3e0); }
    :host([state='error']) span   { color: var(--color-error, #b00020);   background: var(--color-error-bg, #fce4e4); }
  `;

  render() {
    return html`<span part="badge">${this.label}</span>`;
  }
}

customElements.define('wla-badge', WlaBadge);
