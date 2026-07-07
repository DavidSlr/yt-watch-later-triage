import { LitElement, html, css } from 'lit';

/**
 * Video card for the horizontal queue.
 * @attr {string}  thumbnail - image URL
 * @attr {string}  title
 * @attr {string}  channel
 * @attr {string}  duration  - formatted string e.g. "12:34"
 * @attr {string}  date      - upload date string
 * @attr {boolean} active    - currently playing
 * @fires wla-select
 * @fires wla-remove
 */
export class WlaQueueCard extends LitElement {
  static properties = {
    thumbnail: { type: String },
    title:     { type: String },
    channel:   { type: String },
    duration:  { type: String },
    date:      { type: String },
    active:    { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.thumbnail = '';
    this.title = '';
    this.channel = '';
    this.duration = '';
    this.date = '';
    this.active = false;
  }

  static styles = css`
    :host { display: block; width: 176px; flex-shrink: 0; }

    article {
      width: 100%;
      height: 100%;
      border: 1px solid var(--color-border, #2e2e2e);
      border-radius: var(--radius-sm, 6px);
      background: var(--color-surface, #1a1a1a);
      overflow: hidden;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: border-color var(--transition-fast, 0.12s),
                  background var(--transition-fast, 0.12s);
    }
    article:hover  { border-color: #444; background: var(--color-surface-hover, #222); }
    :host([active]) article { border-color: var(--color-accent, #ff0000); }

    .thumb {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #0d0d0d;
      overflow: hidden;
      flex-shrink: 0;
    }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .duration {
      position: absolute;
      bottom: 3px;
      right: 4px;
      background: rgba(0,0,0,0.85);
      color: #fff;
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-bold, 700);
      padding: 1px 4px;
      border-radius: 3px;
      pointer-events: none;
    }

    button.remove {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 20px;
      height: 20px;
      background: rgba(0,0,0,0.72);
      border: none;
      border-radius: 50%;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      opacity: 0;
      transition: opacity var(--transition-fast, 0.12s), background var(--transition-fast, 0.12s);
      z-index: 1;
    }
    article:hover button.remove { opacity: 1; }
    button.remove:hover { background: rgba(180,0,0,0.9); }

    .body {
      padding: 5px 8px 6px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
      min-height: 0;
    }

    .title {
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #e8e8e8);
      line-height: var(--line-height-base, 1.45);
      overflow: hidden;
      flex: 1;
      min-height: 0;
    }

    .meta {
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--color-text-muted, #aaa);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
  `;

  _select() {
    this.dispatchEvent(new CustomEvent('wla-select', { bubbles: true, composed: true }));
  }

  _remove(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('wla-remove', { bubbles: true, composed: true }));
  }

  render() {
    const meta = [this.channel, this.date].filter(Boolean).join(' · ');
    return html`
      <article part="card" @click=${this._select}>
        <div class="thumb" part="thumb">
          <img src=${this.thumbnail} alt="" loading="lazy" @error=${(e) => { e.target.style.display = 'none'; }} />
          ${this.duration ? html`<span class="duration">${this.duration}</span>` : ''}
          <button class="remove" aria-label="Remove from Watch Later" title="Remove from Watch Later" @click=${this._remove}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="body" part="body">
          <div class="title" title=${this.title}>${this.title}</div>
          <div class="meta" title=${meta}>${meta}</div>
        </div>
      </article>
    `;
  }
}

customElements.define('wla-queue-card', WlaQueueCard);
