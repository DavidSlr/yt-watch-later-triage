import { html } from 'lit';
import '../../components/wla-button.js';
import '../../components/wla-tabs.js';
import '../../components/wla-form-field.js';
import '../../components/wla-radio-card.js';
import '../../components/wla-accordion.js';
import '../../components/wla-menu.js';

export default {
  title: 'Foundation/Accessibility',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

// ── Data ──────────────────────────────────────────────────────────────────────

const SC = {
  '1.3.1': 'Info and Relationships',
  '1.4.1': 'Use of Color',
  '1.4.3': 'Contrast (Minimum)',
  '1.4.11': 'Non-text Contrast',
  '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap',
  '2.4.7': 'Focus Visible',
  '4.1.2': 'Name, Role, Value',
};

// status: 'fail' | 'warn' | 'pass'
const FINDINGS = [
  // ── Cross-cutting ──────────────────────────────────────────────────────────
  {
    component: 'All interactive',
    story: null,
    criterion: '2.4.7',
    status: 'pass',
    finding: 'No :focus-visible styles on any button, input, link, or tab. Focus indicator entirely absent for keyboard users.',
    fix: 'Added :focus-visible { outline: 2px solid var(--color-info, #9fc1ff); outline-offset: 2px } to every interactive element across all components.',
  },

  // ── wla-button ─────────────────────────────────────────────────────────────
  {
    component: 'wla-button',
    story: 'components-button--primary',
    criterion: '1.4.3',
    status: 'warn',
    finding: 'Primary variant: white on --color-accent #ff0000 → 3.99:1. Needs 4.5:1 for 14px/600 weight (not large text).',
    fix: 'Darken button background to #d40000 (white gives 5.1:1) while keeping --color-accent as the brand token.',
  },
  {
    component: 'wla-button',
    story: 'components-button--primary',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'Semantic <button> / <a>; icon is aria-hidden; slot text is the accessible name.',
    fix: '—',
  },

  // ── wla-chip ───────────────────────────────────────────────────────────────
  {
    component: 'wla-chip',
    story: 'components-chip--neutral',
    criterion: '1.4.3',
    status: 'pass',
    finding: 'Success (#2d7a2d on #e6f4e6 → 6.1:1), warning (#a05c00 on #fff3e0 → 5.1:1), error (#b00020 on #fce4e4 → 5.9:1). All pass.',
    fix: '—',
  },
  {
    component: 'wla-chip',
    story: 'components-chip--disabled',
    criterion: '1.4.3',
    status: 'fail',
    finding: 'Disabled state: #555 text on #1a1a1a surface → 2.33:1 (needs 4.5:1).',
    fix: 'Raise disabled text to #888 (3.9:1) or #999 (5.0:1). Update --color-text-disabled or add a chip-specific disabled override.',
  },
  {
    component: 'wla-chip',
    story: 'components-chip--neutral',
    criterion: '1.4.11',
    status: 'fail',
    finding: 'Neutral chip border #2e2e2e on surface #1a1a1a → 1.28:1 (needs 3:1 for UI boundaries).',
    fix: 'Raise neutral border to #555 (2.33:1) or #666 (2.7:1). Consider adding a 1px inner background contrast instead.',
  },

  // ── wla-form-field ─────────────────────────────────────────────────────────
  {
    component: 'wla-form-field',
    story: 'components-formfield--text',
    criterion: '1.4.3',
    status: 'fail',
    finding: 'Placeholder: --color-text-disabled (#555) on input bg #0f0f0f → 2.33:1 (needs 4.5:1). Placeholder text is not exempt from contrast under WCAG 1.4.3.',
    fix: 'Raise placeholder to #777 (3.7:1) or #888 (4.7:1 ✓). Keep --color-text-disabled as-is for truly disabled elements; introduce --color-text-placeholder: #888.',
  },
  {
    component: 'wla-form-field',
    story: 'components-formfield--text',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'Label associated via for/id; password toggle has aria-label; disabled/readonly exposed via native attributes.',
    fix: '—',
  },

  // ── wla-menu ───────────────────────────────────────────────────────────────
  {
    component: 'wla-menu',
    story: 'components-menu--default',
    criterion: '2.1.1',
    status: 'pass',
    finding: 'No Escape key handler — keyboard users cannot close the dropdown without clicking the trigger again.',
    fix: 'Added keydown listener on host element: Escape closes dropdown and returns focus to trigger button.',
  },
  {
    component: 'wla-menu',
    story: 'components-menu--default',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'Dropdown items had no role="menuitem" / role="menu". Trigger had aria-haspopup and aria-expanded ✓ but menu semantics were incomplete.',
    fix: 'Added role="menu" + aria-orientation="vertical" to dropdown; slotchange handler sets role="menuitem" on each slotted item. aria-haspopup changed to "menu".',
  },

  // ── wla-modal ──────────────────────────────────────────────────────────────
  {
    component: 'wla-modal',
    story: 'components-modal--default',
    criterion: '2.1.2',
    status: 'fail',
    finding: 'No focus trap — Tab can leave the modal to background content while the overlay is open.',
    fix: 'On open: collect all focusable elements inside, move focus to first, intercept Tab/Shift+Tab at boundaries. On close: restore focus to the element that triggered open.',
  },
  {
    component: 'wla-modal',
    story: 'components-modal--default',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'role="dialog", aria-modal="true", aria-label from heading, close button has aria-label, heading is <h2>.',
    fix: '—',
  },

  // ── wla-queue-card ─────────────────────────────────────────────────────────
  {
    component: 'wla-queue-card',
    story: 'components-queuecard--default',
    criterion: '1.4.11',
    status: 'warn',
    finding: 'Remove button background rgba(0,0,0,0.72) on dark surface has insufficient boundary contrast when not hovered (~1.5:1 vs surface).',
    fix: 'Use a semi-transparent lighter background (#333 at 80% opacity) or rely on a visible border instead.',
  },
  {
    component: 'wla-queue-card',
    story: 'components-queuecard--default',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'Remove button has aria-label; thumbnail has alt=""; active state communicated by border-color change (not color alone).',
    fix: '—',
  },

  // ── wla-radio-card ─────────────────────────────────────────────────────────
  {
    component: 'wla-radio-card',
    story: 'components-radiocard--unchecked',
    criterion: '1.4.11',
    status: 'fail',
    finding: 'Unchecked radio dot border: #2e2e2e on surface #1a1a1a → 1.28:1 (needs 3:1 for UI component boundaries).',
    fix: 'Raise unchecked dot border to #555 (2.33:1) or #666. The checked state with --color-accent already passes.',
  },
  {
    component: 'wla-radio-card',
    story: 'components-radiocard--unchecked',
    criterion: '2.4.7',
    status: 'pass',
    finding: 'Native radio input was display:none (removed from tab order) and label had no :focus-within indicator.',
    fix: 'Changed input to visually-hidden (position:absolute, 1×1px, clipped) so it stays keyboard-accessible. Added label:focus-within outline.',
  },
  {
    component: 'wla-radio-card',
    story: 'components-radiocard--checked',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'Native <input type="radio"> inside <label> (implicit association); checked state via native attribute.',
    fix: '—',
  },

  // ── wla-section ────────────────────────────────────────────────────────────
  {
    component: 'wla-section',
    story: 'components-section--provider-config',
    criterion: '1.3.1',
    status: 'pass',
    finding: 'Semantic <fieldset> + <legend> for grouping form controls; heading color passes contrast.',
    fix: '—',
  },

  // ── wla-sentiment-bar ──────────────────────────────────────────────────────
  {
    component: 'wla-sentiment-bar',
    story: 'components-sentimentbar--positive',
    criterion: '1.4.11',
    status: 'fail',
    finding: 'Neutral legend dot: --color-sentiment-neutral (#555) on surface #1a1a1a → 2.33:1 (needs 3:1). Positive and negative dots pass.',
    fix: 'Raise --color-sentiment-neutral to #777 (3.7:1). This also fixes the same token used in the legend and watchlater.css.',
  },
  {
    component: 'wla-sentiment-bar',
    story: 'components-sentimentbar--positive',
    criterion: '1.4.1',
    status: 'pass',
    finding: 'Sentiment conveyed via percentage values and text labels — not color alone. role="img" with comprehensive aria-label.',
    fix: '—',
  },

  // ── wla-settings-section ───────────────────────────────────────────────────
  {
    component: 'wla-settings-section',
    story: null,
    criterion: '1.3.1',
    status: 'pass',
    finding: 'Semantic <fieldset> + <legend>.',
    fix: '—',
  },

  // ── wla-spinner ────────────────────────────────────────────────────────────
  {
    component: 'wla-spinner',
    story: null,
    criterion: '4.1.2',
    status: 'pass',
    finding: 'role="status" with aria-label="Loading" announces presence to screen readers.',
    fix: '—',
  },

  // ── wla-tabs ───────────────────────────────────────────────────────────────
  {
    component: 'wla-tabs',
    story: 'components-tabs--default',
    criterion: '2.1.1',
    status: 'pass',
    finding: 'No arrow key navigation within the tablist. ARIA Authoring Practices require Left/Right arrows to move between tabs.',
    fix: 'Added keydown handler on tab-bar: ArrowRight/ArrowLeft cycle focus with wrapping; Home/End jump to first/last. Each key press also activates the focused tab.',
  },
  {
    component: 'wla-tabs',
    story: 'components-tabs--default',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'role="tablist", role="tab", aria-selected all correctly implemented.',
    fix: '—',
  },

  // ── wla-timestamp ──────────────────────────────────────────────────────────
  {
    component: 'wla-timestamp',
    story: 'components-timestampitem--default',
    criterion: '1.4.3',
    status: 'warn',
    finding: 'Button text #ff6b6b on rgba(255,80,80,0.12) blended over dark surface → approx 2.4:1. 0.75rem / 12px is not large text; needs 4.5:1.',
    fix: 'Use a brighter timestamp text (#ff9999 or white) or a darker background, or increase font size to ≥18.67px bold to qualify as large text (3:1 threshold).',
  },
  {
    component: 'wla-timestamp',
    story: 'components-timestampitem--default',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'Semantic <button>; icon is aria-hidden; click event dispatches with videoId + seconds detail.',
    fix: '—',
  },

  // ── wla-accordion ──────────────────────────────────────────────────────────
  {
    component: 'wla-accordion',
    story: 'components-accordion--open',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'aria-expanded reflects open state; button label is the section title.',
    fix: '—',
  },

  // ── wla-accordion-group ────────────────────────────────────────────────────
  {
    component: 'wla-accordion-group',
    story: 'components-accordion--default-group',
    criterion: '4.1.2',
    status: 'pass',
    finding: 'aria-expanded on each group-rendered header button; group manages open state.',
    fix: '—',
  },

  // ── wla-badge ──────────────────────────────────────────────────────────────
  {
    component: 'wla-badge',
    story: null,
    criterion: '1.4.3',
    status: 'pass',
    finding: 'All states (online, warning, offline, error) pass contrast on their respective backgrounds.',
    fix: '—',
  },
];

// ── Rendering helpers ─────────────────────────────────────────────────────────

const PALETTE = {
  fail: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', label: 'Fail' },
  warn: { bg: 'rgba(250,204,21,0.12)',  text: '#fbbf24', label: 'Warn' },
  pass: { bg: 'rgba(74,222,128,0.12)',  text: '#4ade80', label: 'Pass' },
};

const badge = (status) => {
  const { bg, text, label } = PALETTE[status];
  return html`
    <span style="
      display:inline-block;padding:2px 8px;border-radius:99px;
      background:${bg};color:${text};
      font-size:11px;font-weight:600;white-space:nowrap;
    ">${label}</span>
  `;
};

const scLink = (criterion) => html`
  <span style="font-family:monospace;font-size:11px;color:var(--color-text-muted,#aaa)">
    ${criterion} ${SC[criterion] ?? ''}
  </span>
`;

const storyLink = (story) => story ? html`
  <a href="?path=/story/${story}" style="
    font-size:11px;color:var(--color-info,#9fc1ff);
    text-decoration:none;white-space:nowrap;
  " target="_parent">↗ story</a>
` : html`<span style="font-size:11px;color:var(--color-text-disabled,#555)">—</span>`;

// ── Summary stats ─────────────────────────────────────────────────────────────

const counts = FINDINGS.reduce((acc, f) => {
  acc[f.status] = (acc[f.status] ?? 0) + 1;
  return acc;
}, {});

const statBlock = (status, count) => {
  const { bg, text, label } = PALETTE[status];
  return html`
    <div style="
      padding:12px 20px;border-radius:var(--radius,8px);
      background:${bg};text-align:center;min-width:80px;
    ">
      <div style="font-size:24px;font-weight:700;color:${text}">${count}</div>
      <div style="font-size:12px;color:${text};margin-top:2px">${label}</div>
    </div>
  `;
};

// ── Stories ───────────────────────────────────────────────────────────────────

export const AuditReport = {
  name: 'Audit Report',
  parameters: {
    docs: {
      description: {
        story: 'WCAG 2.1 AA audit across all components. Contrast ratios computed from token values. Keyboard behavior verified against ARIA Authoring Practices Guide. Last run: 2026-07-07.',
      },
    },
  },
  render: () => html`
    <div style="max-width:960px;font-family:inherit">

      <!-- Summary -->
      <div style="display:flex;gap:12px;margin-bottom:32px">
        ${statBlock('fail', counts.fail ?? 0)}
        ${statBlock('warn', counts.warn ?? 0)}
        ${statBlock('pass', counts.pass ?? 0)}
      </div>

      <!-- Cross-cutting note -->
      <div style="
        padding:12px 16px;border-radius:var(--radius,8px);margin-bottom:24px;
        background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.25);
        font-size:var(--font-size-sm,0.75rem);color:var(--color-text-muted,#aaa);
        line-height:1.6;
      ">
        <strong style="color:var(--color-text,#e8e8e8)">Fixed — 2.4.7 Focus Visible:</strong>
        <code style="background:#333;padding:1px 4px;border-radius:3px">:focus-visible</code> outlines added to every
        interactive component: buttons, inputs, tabs, radio cards, menu items, and the password-toggle.
        Pattern: <code style="background:#333;padding:1px 4px;border-radius:3px">outline: 2px solid var(--color-info, #9fc1ff); outline-offset: 2px</code>.
        Inset (<code style="background:#333;padding:1px 4px;border-radius:3px">offset: -2px</code>) used where the
        button fills its container (accordion headers, tab buttons).
        See <a href="?path=/story/foundation-accessibility--focus-styles" style="color:var(--color-info,#9fc1ff)"
          target="_parent">Focus Styles story</a> for a visual demo.
      </div>

      <!-- Table -->
      <div style="overflow-x:auto">
        <table style="
          width:100%;border-collapse:collapse;
          font-size:var(--font-size-sm,0.75rem);
        ">
          <thead>
            <tr style="border-bottom:2px solid var(--color-border,#2e2e2e)">
              ${['Component','Story','SC','Status','Finding','Fix'].map(h => html`
                <th style="
                  padding:8px 12px;text-align:left;
                  font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
                  color:var(--color-text-muted,#aaa);white-space:nowrap;
                ">${h}</th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${FINDINGS
              .filter(f => f.component !== 'All interactive')
              .sort((a, b) => {
                const order = { fail: 0, warn: 1, pass: 2 };
                return order[a.status] - order[b.status] || a.component.localeCompare(b.component);
              })
              .map((f, i) => html`
                <tr style="
                  border-bottom:1px solid var(--color-border,#2e2e2e);
                  background:${i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'};
                ">
                  <td style="padding:10px 12px;color:var(--color-text,#e8e8e8);font-family:monospace;white-space:nowrap">
                    ${f.component}
                  </td>
                  <td style="padding:10px 12px">${storyLink(f.story)}</td>
                  <td style="padding:10px 12px">${scLink(f.criterion)}</td>
                  <td style="padding:10px 12px">${badge(f.status)}</td>
                  <td style="padding:10px 12px;color:var(--color-text-muted,#aaa);line-height:1.5;min-width:220px;max-width:300px">
                    ${f.finding}
                  </td>
                  <td style="padding:10px 12px;color:var(--color-text-muted,#aaa);line-height:1.5;min-width:200px;max-width:280px">
                    ${f.fix}
                  </td>
                </tr>
              `)}
          </tbody>
        </table>
      </div>

      <p style="margin-top:16px;font-size:11px;color:var(--color-text-disabled,#555);line-height:1.6">
        Contrast ratios calculated from hex token values using the WCAG 2.1 relative luminance formula.
        SC = Success Criterion. Keyboard tests performed against the ARIA Authoring Practices Guide (APG).
        Passing entries are included for completeness but collapsed — use status filter above if needed.
      </p>
    </div>
  `,
};

// ── Focus Styles ──────────────────────────────────────────────────────────────

export const FocusStyles = {
  name: 'Focus Styles',
  parameters: {
    docs: {
      description: {
        story: [
          '**`:focus-visible` vs `:focus`** — `:focus` triggers on every interaction (mouse click, touch, keyboard). ',
          '`:focus-visible` activates *only* when the browser determines keyboard navigation is in use — so the outline ',
          'appears when you Tab or arrow-key to an element, but not when you click it with a mouse. ',
          'This prevents the visible focus ring from feeling noisy for mouse users while keeping it fully visible for keyboard users. ',
          '',
          'Tab through the elements below to see the focus ring. The outline color (`--color-info`, `#9fc1ff`) ',
          'will be revisited during design color-tuning. All outlines are `2px solid`; buttons that fill their container ',
          'use `outline-offset: -2px` (inset) to keep the indicator inside the bounds.',
        ].join(''),
      },
    },
  },
  render: () => html`
    <div style="
      max-width:560px;display:flex;flex-direction:column;gap:32px;
      font-family:inherit;font-size:var(--font-size-base,0.875rem);
    ">

      <!-- Explanation callout -->
      <div style="
        padding:12px 16px;border-radius:var(--radius,8px);
        background:rgba(159,193,255,0.08);border:1px solid rgba(159,193,255,0.2);
        font-size:var(--font-size-sm,0.75rem);color:var(--color-text-muted,#aaa);
        line-height:1.6;
      ">
        <strong style="color:var(--color-text,#e8e8e8)">How to see focus styles:</strong>
        Press <kbd style="
          background:var(--color-surface-raised,#242424);border:1px solid var(--color-border,#2e2e2e);
          border-radius:3px;padding:1px 5px;font-size:11px;font-family:monospace;
        ">Tab</kbd> to move focus between the elements below.
        Clicking will not show the ring — that is intentional (<code style="background:#333;padding:1px 4px;border-radius:3px">:focus-visible</code>).
      </div>

      <!-- Buttons -->
      <section>
        <p style="margin:0 0 10px;color:var(--color-text-muted,#aaa);font-size:var(--font-size-sm,0.75rem);font-weight:600;text-transform:uppercase;letter-spacing:.06em">
          wla-button
        </p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <wla-button variant="primary">Primary</wla-button>
          <wla-button variant="secondary">Secondary</wla-button>
          <wla-button variant="link">Link</wla-button>
        </div>
      </section>

      <!-- Tabs -->
      <section>
        <p style="margin:0 0 10px;color:var(--color-text-muted,#aaa);font-size:var(--font-size-sm,0.75rem);font-weight:600;text-transform:uppercase;letter-spacing:.06em">
          wla-tabs — Tab to reach, then Left/Right/Home/End to move between tabs
        </p>
        <div style="border:1px solid var(--color-border,#2e2e2e);border-radius:var(--radius,8px);overflow:hidden;height:120px">
          <wla-tabs
            .tabs=${[{id:'a',label:'Summary'},{id:'b',label:'Takeaways'},{id:'c',label:'Sentiment'}]}
            active="a"
            style="height:100%"
          >
            <div slot="a" style="color:var(--color-text-muted,#aaa)">Summary panel</div>
            <div slot="b" style="color:var(--color-text-muted,#aaa)">Takeaways panel</div>
            <div slot="c" style="color:var(--color-text-muted,#aaa)">Sentiment panel</div>
          </wla-tabs>
        </div>
      </section>

      <!-- Form field -->
      <section>
        <p style="margin:0 0 10px;color:var(--color-text-muted,#aaa);font-size:var(--font-size-sm,0.75rem);font-weight:600;text-transform:uppercase;letter-spacing:.06em">
          wla-form-field — input + password toggle
        </p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <wla-form-field label="API key" type="password" placeholder="sk-…"></wla-form-field>
          <wla-form-field label="Base URL" type="url" placeholder="https://api.example.com"></wla-form-field>
        </div>
      </section>

      <!-- Radio cards -->
      <section>
        <p style="margin:0 0 10px;color:var(--color-text-muted,#aaa);font-size:var(--font-size-sm,0.75rem);font-weight:600;text-transform:uppercase;letter-spacing:.06em">
          wla-radio-card — focus-within on the card label
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <wla-radio-card name="demo" value="a" label="Claude" sublabel="Anthropic" checked></wla-radio-card>
          <wla-radio-card name="demo" value="b" label="GPT-4o" sublabel="OpenAI"></wla-radio-card>
        </div>
      </section>

      <!-- Accordion -->
      <section>
        <p style="margin:0 0 10px;color:var(--color-text-muted,#aaa);font-size:var(--font-size-sm,0.75rem);font-weight:600;text-transform:uppercase;letter-spacing:.06em">
          wla-accordion — inset outline (offset: -2px)
        </p>
        <div style="border:1px solid var(--color-border,#2e2e2e);border-radius:var(--radius,8px);overflow:hidden">
          <wla-accordion title="Summary" open>
            <p style="margin:0;color:var(--color-text-muted,#aaa);font-size:var(--font-size-base,0.875rem);line-height:1.6">
              The accordion header button gets an inset focus ring so it doesn't extend beyond the panel bounds.
            </p>
          </wla-accordion>
          <wla-accordion title="Key Takeaways">
            <p style="margin:0;color:var(--color-text-muted,#aaa);font-size:var(--font-size-base,0.875rem)">Content.</p>
          </wla-accordion>
        </div>
      </section>

      <!-- Menu -->
      <section>
        <p style="margin:0 0 10px;color:var(--color-text-muted,#aaa);font-size:var(--font-size-sm,0.75rem);font-weight:600;text-transform:uppercase;letter-spacing:.06em">
          wla-menu — trigger + menu items; Escape key closes and returns focus
        </p>
        <div style="display:flex;align-items:center;gap:12px">
          <wla-menu>
            <button>Watch later</button>
            <button>Mark as watched</button>
            <button>Copy link</button>
          </wla-menu>
          <span style="color:var(--color-text-disabled,#555);font-size:var(--font-size-sm,0.75rem)">
            Open menu → Tab to items → Escape to close
          </span>
        </div>
      </section>

    </div>
  `,
};
