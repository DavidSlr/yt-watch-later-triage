import { LitElement, html, svg, css, unsafeCSS } from 'lit';

// ── Layout (SVG user units; the viewBox is 40 high) ──────────────────────────
// Logo, then GAP, four circles, GAP, sparkle. The circles sit close enough
// that a liquid bridge can join neighbours, and the sparkle is placed after
// them so both gaps are identical.
const LOGO_RIGHT = 38;
const GAP = 27;
const CY = 20;
const R_REST = 5.5;     // empty circle
const R_FULL = 8.5;     // circle holding the volume
const SPACING = 19.5;   // centre to centre
const COUNT = 4;

const CIRCLE_X = Array.from({ length: COUNT }, (_, i) =>
  LOGO_RIGHT + GAP + R_REST + i * SPACING);
const SPARKLE_LEFT = CIRCLE_X[COUNT - 1] + R_REST + GAP;
const SPARKLE_SHIFT = SPARKLE_LEFT - 166;          // star paths are drawn from x = 166
const VIEW_W = 196 + SPARKLE_SHIFT + 4;            // same 4-unit margin both sides
const WIDTH_PX = Math.round((VIEW_W / 40) * 33.6); // keeps the old 33.6px height

// ── Timeline (ms) ────────────────────────────────────────────────────────────
// First circle fills, the volume passes circle → circle three times, the last
// circle drains, then a short pause.
const GROW_MS = 400;
const HOP_MS = 800;
const MOVE_SHARE = 0.75;   // rest of each hop lets the bounce settle
const SHRINK_MS = 400;
const PAUSE_MS = 200;
const HOP_START = (k) => GROW_MS + k * HOP_MS;
const SHRINK_START = HOP_START(COUNT - 1);
const CYCLE_MS = SHRINK_START + SHRINK_MS + PAUSE_MS;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Mostly eased, partly linear, so a transfer never fully stalls midway.
const travel = (t) => 0.6 * smoothstep(0, 1, t) + 0.4 * t;
// Progress 0..1 of the transfer from circle k to circle k + 1.
const hopProgress = (ms, k) => travel(clamp01((ms - HOP_START(k)) / (HOP_MS * MOVE_SHARE)));
// Damped wobble starting at τ = 0 (seconds): a soft, slow settle after a merge
// or a split.
const wobble = (tau) => (tau < 0 ? 0 : Math.exp(-4 * tau) * Math.sin(11 * tau));

/**
 * Analysis-in-progress indicator: liquid volume passes from circle to circle
 * between a YouTube logo and an AI sparkle. The first circle fills up, each
 * full circle then pours into its neighbour through a liquid bridge (the
 * source drains while the target swells, and both bounce as they merge and
 * split), and the last circle drains away. A shared SVG "goo" filter (blur +
 * alpha threshold) melts the circles and bridges together.
 *
 * Color follows `currentColor` (default --color-text); set `color` on the host
 * to change it.
 *
 * @attr {string} label - Accessible name announced to screen readers
 */
export class WlaAnalyzing extends LitElement {
  static properties = {
    label: { type: String },
  };

  constructor() {
    super();
    this.label = 'Analyzing video';
    this._raf = 0;
  }

  static styles = css`
    :host {
      display: block;
      width: ${unsafeCSS(WIDTH_PX)}px;
      max-width: 100%;
      color: var(--color-text, #e8e8e8);
      margin: var(--space-2, 8px) 0;
    }

    svg { display: block; width: 100%; height: auto; overflow: visible; }

    .star { transform-box: fill-box; transform-origin: center; }
  `;

  render() {
    return html`
      <svg viewBox="0 0 ${VIEW_W} 40" role="status" aria-label=${this.label}>
        <defs>
          <filter id="goo" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
          </filter>
          <mask id="play-cutout">
            <rect x="0" y="0" width="40" height="40" fill="white" />
            <path d="M17 13.5 L27 20 L17 26.5 Z" fill="black" />
          </mask>
        </defs>

        <!-- YouTube logo -->
        <rect x="4" y="8" width="34" height="24" rx="7"
              fill="currentColor" mask="url(#play-cutout)" />

        <!-- Circles + the bridges between neighbours, melted by the goo filter -->
        <g filter="url(#goo)" fill="currentColor">
          ${CIRCLE_X.map(x => svg`<circle class="dot" cx=${x} cy=${CY} r=${R_REST} />`)}
          ${CIRCLE_X.slice(1).map((x, k) => svg`
            <ellipse class="bridge" cx=${(x + CIRCLE_X[k]) / 2} cy=${CY} rx=${SPACING / 2} ry="0" />`)}
        </g>

        <!-- AI sparkle: one large four-point star and two small ones -->
        <g transform="translate(${SPARKLE_SHIFT} 0)">
          <path class="star big" fill="currentColor"
                d="M178 7 C179.6 15.4 181.6 17.4 190 19 C181.6 20.6 179.6 22.6 178 31 C176.4 22.6 174.4 20.6 166 19 C174.4 17.4 176.4 15.4 178 7 Z" />
          <path class="star small-a" fill="currentColor"
                d="M192 4 C192.5 6.5 193.5 7.5 196 8 C193.5 8.5 192.5 9.5 192 12 C191.5 9.5 190.5 8.5 188 8 C190.5 7.5 191.5 6.5 192 4 Z" />
          <path class="star small-b" fill="currentColor"
                d="M191 27 C191.4 29 192 29.6 194 30 C192 30.4 191.4 31 191 33 C190.6 31 190 30.4 188 30 C190 29.6 190.6 29 191 27 Z" />
        </g>
      </svg>
    `;
  }

  firstUpdated() {
    const root = this.renderRoot;
    this._dots = [...root.querySelectorAll('.dot')];
    this._bridges = [...root.querySelectorAll('.bridge')];
    this._stars = [...root.querySelectorAll('.star')];
    this._startLoop();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this._dots) this._startLoop();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  _startLoop() {
    cancelAnimationFrame(this._raf);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this._drawFrame(HOP_START(1) - 20);   // still frame: volume settled in circle 2
      return;
    }
    const start = performance.now();
    this._drawFrame(0);   // draw now so nothing is blank before the first frame
    const tick = (now) => {
      this._drawFrame((now - start) % CYCLE_MS);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  // ms: time within the cycle
  _drawFrame(ms) {
    for (let i = 0; i < COUNT; i++) {
      // How full circle i is: fills from the left neighbour (or on its own for
      // the first circle), drains into the right one (or on its own for the last).
      const rise = i === 0
        ? smoothstep(0, GROW_MS * 0.7, ms)
        : smoothstep(0.15, 0.85, hopProgress(ms, i - 1));
      const fall = i === COUNT - 1
        ? smoothstep(SHRINK_START, SHRINK_START + SHRINK_MS * 0.7, ms)
        : smoothstep(0.15, 0.85, hopProgress(ms, i));

      // Bounce when the volume lands, smaller recoil when it leaves.
      const arrived = i === 0 ? GROW_MS * 0.7 : HOP_START(i - 1) + HOP_MS * MOVE_SHARE;
      const left = i === COUNT - 1
        ? SHRINK_START + SHRINK_MS * 0.7
        : HOP_START(i) + HOP_MS * MOVE_SHARE * 0.85;

      const r = R_REST + (R_FULL - R_REST) * rise * (1 - fall)
              + 0.55 * wobble((ms - arrived) / 1000)
              + 0.3 * wobble((ms - left) / 1000);
      this._dots[i].setAttribute('r', r.toFixed(2));
    }

    // Each bridge thickens while its pair is pouring, then thins and snaps.
    this._bridges.forEach((bridge, k) => {
      const neck = Math.sin(Math.PI * smoothstep(0.08, 0.92, hopProgress(ms, k)));
      bridge.setAttribute('ry', (3.6 * neck).toFixed(2));
    });

    // Sparkle pops as the last circle drains; small stars follow just after.
    const pop = (delay) => {
      const t = (ms - SHRINK_START - delay) / 400;
      return t < 0 || t > 1 ? 0 : Math.sin(Math.PI * t);
    };
    const [big, smallA, smallB] = this._stars;
    big.style.transform = `scale(${1 + 0.16 * pop(120)}) rotate(${12 * pop(120)}deg)`;
    smallA.style.transform = `scale(${1 + 0.4 * pop(180)})`;
    smallB.style.transform = `scale(${1 + 0.4 * pop(250)})`;
  }
}

customElements.define('wla-analyzing', WlaAnalyzing);
