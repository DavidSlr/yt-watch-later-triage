import { LitElement, html, css } from 'lit';

/**
 * Modal dialog with overlay.
 * @attr {boolean} open
 * @attr {string}  heading
 * @slot default - modal body content
 * @slot footer  - action buttons
 * @fires wla-close
 */
export class WlaModal extends LitElement {
  static properties = {
    open:    { type: Boolean, reflect: true },
    heading: { type: String },
  };

  constructor() {
    super();
    this.open = false;
    this.heading = '';
  }

  static styles = css`
    :host { display: contents; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: var(--space-4, 16px);
    }

    .modal {
      background: var(--color-surface, #1a1a1a);
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: var(--radius, 8px);
      box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.5));
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4, 16px);
      border-bottom: 1px solid var(--color-border, #2e2e2e);
      flex-shrink: 0;
    }

    h2 {
      margin: 0;
      font-size: var(--font-size-lg, 1.0625rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-text, #e8e8e8);
    }

    button.close {
      background: transparent;
      border: none;
      color: var(--color-text-muted, #aaa);
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm, 4px);
      display: flex;
      align-items: center;
      transition: color var(--transition-fast, 0.12s);
    }
    button.close:hover { color: var(--color-text, #e8e8e8); }

    .body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4, 16px);
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }

    footer {
      display: flex;
      gap: var(--space-2, 8px);
      justify-content: flex-end;
      padding: var(--space-3, 12px) var(--space-4, 16px);
      border-top: 1px solid var(--color-border, #2e2e2e);
      flex-shrink: 0;
    }
    footer:empty { display: none; }
  `;

  _close() {
    this.dispatchEvent(new CustomEvent('wla-close', { bubbles: true, composed: true }));
  }

  render() {
    if (!this.open) return html``;
    return html`
      <div class="overlay" part="overlay" @click=${(e) => e.target === e.currentTarget && this._close()}>
        <div class="modal" part="modal" role="dialog" aria-modal="true" aria-label=${this.heading}>
          <header part="header">
            <h2>${this.heading}</h2>
            <button class="close" aria-label="Close" @click=${this._close}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </header>
          <div class="body" part="body"><slot></slot></div>
          <footer part="footer"><slot name="footer"></slot></footer>
        </div>
      </div>
    `;
  }
}

customElements.define('wla-modal', WlaModal);
