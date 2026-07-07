import { LitElement, html, css } from 'lit';

/**
 * Horizontal stacked sentiment bar.
 * @attr {number} positive - 0–100
 * @attr {number} neutral  - 0–100
 * @attr {number} negative - 0–100
 */
export class WlaSentimentBar extends LitElement {
  static properties = {
    positive: { type: Number },
    neutral:  { type: Number },
    negative: { type: Number },
  };

  constructor() {
    super();
    this.positive = 0;
    this.neutral = 0;
    this.negative = 0;
  }

  static styles = css`
    :host { display: block; }

    .bar {
      display: flex;
      height: 8px;
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
      gap: 1px;
    }

    .seg {
      height: 100%;
      min-width: 2px;
      transition: width var(--transition-base, 0.2s);
    }
    .seg-pos { background: var(--color-sentiment-positive, #4ade80); }
    .seg-neu { background: var(--color-sentiment-neutral, #555); }
    .seg-neg { background: var(--color-sentiment-negative, #f87171); }

    .legend {
      display: flex;
      gap: var(--space-3, 12px);
      margin-top: var(--space-2, 8px);
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--color-text-muted, #aaa);
    }
    .legend-item { display: flex; align-items: center; gap: 5px; }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-pos { background: var(--color-sentiment-positive, #4ade80); }
    .dot-neu { background: var(--color-sentiment-neutral, #555); }
    .dot-neg { background: var(--color-sentiment-negative, #f87171); }
  `;

  render() {
    const total = this.positive + this.neutral + this.negative || 100;
    const pct = (n) => `${Math.round((n / total) * 100)}%`;
    return html`
      <div class="bar" part="bar" role="img" aria-label="Sentiment: ${pct(this.positive)} positive, ${pct(this.neutral)} neutral, ${pct(this.negative)} negative">
        <span class="seg seg-pos" style="width:${pct(this.positive)}"></span>
        <span class="seg seg-neu" style="width:${pct(this.neutral)}"></span>
        <span class="seg seg-neg" style="width:${pct(this.negative)}"></span>
      </div>
      <div class="legend" part="legend">
        <span class="legend-item"><span class="dot dot-pos"></span>${pct(this.positive)} positive</span>
        <span class="legend-item"><span class="dot dot-neu"></span>${pct(this.neutral)} neutral</span>
        <span class="legend-item"><span class="dot dot-neg"></span>${pct(this.negative)} negative</span>
      </div>
    `;
  }
}

customElements.define('wla-sentiment-bar', WlaSentimentBar);
