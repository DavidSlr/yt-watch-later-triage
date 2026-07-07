import { LitElement, html, css } from 'lit';

/**
 * Loading spinner.
 * @attr {string} size - sm | md | lg
 */
export class WlaSpinner extends LitElement {
  static properties = {
    size: { type: String, reflect: true },
  };

  constructor() {
    super();
    this.size = 'md';
  }

  static styles = css`
    :host { display: inline-block; }

    @keyframes spin { to { transform: rotate(360deg); } }

    span {
      display: block;
      border-radius: 50%;
      border: 2.5px solid var(--color-border, #2e2e2e);
      border-top-color: var(--color-text-muted, #aaa);
      animation: spin 0.7s linear infinite;
    }

    :host([size='sm']) span { width: 14px; height: 14px; }
    :host([size='md']) span { width: 22px; height: 22px; }
    :host([size='lg']) span { width: 36px; height: 36px; border-width: 3.5px; }
  `;

  render() {
    return html`<span part="spinner" role="status" aria-label="Loading"></span>`;
  }
}

customElements.define('wla-spinner', WlaSpinner);
