import { LitElement, html, css } from 'lit';
import './wla-accordion.js';

/**
 * Scrollable accordion container with dual-sticky headers.
 *
 * All sections share one scrollable region. The group renders its own header
 * buttons inside its shadow DOM — in the same tree as the scroll container —
 * so `position: sticky` works correctly (shadow DOM sticky is bounded by the
 * containing block, which would be the accordion host if headers lived there).
 *
 * Each accordion child is assigned a named slot and told to hide its own
 * header via the `in-group` attribute. The group controls open/closed state
 * by setting `el.open` directly and re-rendering its header buttons.
 *
 * @slot default - wla-accordion elements
 */
export class WlaAccordionGroup extends LitElement {
  static properties = {
    _sections: { state: true },
  };

  constructor() {
    super();
    this._sections = [];
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .scroll {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #333 transparent;
    }

    .header {
      position: sticky;
      z-index: 2;
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0 var(--space-4, 16px);
      height: 44px;
      box-sizing: border-box;
      background: var(--color-surface, #1a1a1a);
      border: none;
      border-bottom: 1px solid var(--color-border, #2e2e2e);
      color: var(--color-text-muted, #aaa);
      font-size: var(--font-size-base, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: background var(--transition-fast, 0.12s), color var(--transition-fast, 0.12s);
    }
    .header:hover { background: var(--color-surface-hover, #222); color: var(--color-text, #e8e8e8); }
    .header:focus-visible { outline: 2px solid var(--color-info, #9fc1ff); outline-offset: -2px; }
    .header.open  { color: var(--color-text, #e8e8e8); }

    .header-title { flex: 1; }

    .header-arrow {
      transition: transform var(--transition-base, 0.2s);
      opacity: 0.5;
      flex-shrink: 0;
    }
    .header.open .header-arrow { transform: rotate(90deg); opacity: 0.8; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._readSections();
    this._observer = new MutationObserver(() => this._readSections());
    this._observer.observe(this, { childList: true, attributes: true, attributeFilter: ['title', 'open'] });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  _readSections() {
    const accordions = Array.from(this.children)
      .filter(el => el.tagName.toLowerCase() === 'wla-accordion');

    accordions.forEach((el, i) => {
      el.setAttribute('slot', `acc-${i}`);
      el.toggleAttribute('in-group', true);
    });

    this._sections = accordions.map(el => ({ title: el.title, open: el.open, el }));
  }

  _toggle(section) {
    section.el.open = !section.el.open;
    this._sections = this._sections.map(s =>
      s.el === section.el ? { ...s, open: section.el.open } : s
    );
  }

  render() {
    const n = this._sections.length;
    const H = 44;
    return html`
      <div class="scroll">
        ${this._sections.map((section, i) => html`
          <button
            class="header ${section.open ? 'open' : ''}"
            style="top: ${i * H}px; bottom: ${(n - 1 - i) * H}px"
            @click=${() => this._toggle(section)}
            aria-expanded=${section.open}
          >
            <span class="header-title">${section.title}</span>
            <svg class="header-arrow" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <slot name="acc-${i}"></slot>
        `)}
      </div>
    `;
  }
}

customElements.define('wla-accordion-group', WlaAccordionGroup);
