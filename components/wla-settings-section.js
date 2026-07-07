import { LitElement, html, css } from 'lit';

/**
 * Labeled settings section — a bordered fieldset with a legend title
 * and slotted form content.
 * @attr {string} heading - section title shown in the legend
 */
export class WlaSettingsSection extends LitElement {
  static properties = {
    heading: { type: String },
  };

  constructor() {
    super();
    this.heading = '';
  }

  static styles = css`
    :host { display: block; }

    fieldset {
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: var(--radius, 8px);
      padding: 0 var(--space-3, 14px) var(--space-3, 14px);
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1, 4px);
    }

    legend {
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text-muted, #aaa);
      padding: 0 var(--space-1, 4px);
    }

    ::slotted(wla-form-field),
    ::slotted([slot]) {
      margin-top: var(--space-2, 8px);
    }
  `;

  render() {
    return html`
      <fieldset part="fieldset">
        <legend part="legend">${this.heading}</legend>
        <slot></slot>
      </fieldset>
    `;
  }
}

customElements.define('wla-settings-section', WlaSettingsSection);
