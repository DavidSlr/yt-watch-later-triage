import { html } from 'lit';
import '../components/wla-accordion.js';
import '../components/wla-accordion-group.js';

export default {
  title: 'Components/Accordion',
  component: 'wla-accordion',
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    open:  { control: 'boolean' },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Single expandable section. Wrap multiple instances in [`wla-accordion-group`](?path=/story/components-accordiongroup--default) to get dual-sticky headers: every header stays visible at either the top or bottom edge of the viewport while the full content scrolls as one continuous region.',
      },
    },
  },
};

export const Open = {
  args: { title: 'Summary', open: true },
  render: ({ title, open }) => html`
    <div style="width:320px;border:1px solid var(--color-border);border-radius:var(--radius)">
      <wla-accordion title=${title} ?open=${open}>
        <p style="color:var(--color-text-muted);font-size:var(--font-size-base);line-height:1.6;margin:0">
          This video explores the fundamentals of web component design systems,
          covering token management, Storybook integration, and Figma workflow.
        </p>
      </wla-accordion>
    </div>
  `,
};

export const Closed = {
  args: { title: 'Key Takeaways', open: false },
  render: ({ title, open }) => html`
    <div style="width:320px;border:1px solid var(--color-border);border-radius:var(--radius)">
      <wla-accordion title=${title} ?open=${open}>
        <p style="color:var(--color-text-muted);font-size:var(--font-size-base);margin:0">Hidden content.</p>
      </wla-accordion>
    </div>
  `,
};

export const Stacked = {
  render: () => html`
    <div style="width:320px;border:1px solid var(--color-border);border-radius:var(--radius)">
      <wla-accordion title="Summary" open>
        <p style="color:var(--color-text-muted);font-size:var(--font-size-base);line-height:1.6;margin:0">AI-generated summary appears here.</p>
      </wla-accordion>
      <wla-accordion title="Key Takeaways">
        <p style="color:var(--color-text-muted);font-size:var(--font-size-base);margin:0">Bullet-point takeaways with timestamps.</p>
      </wla-accordion>
      <wla-accordion title="Comment Sentiment">
        <p style="color:var(--color-text-muted);font-size:var(--font-size-base);margin:0">Sentiment analysis.</p>
      </wla-accordion>
      <wla-accordion title="Contextual Tags">
        <p style="color:var(--color-text-muted);font-size:var(--font-size-base);margin:0">Topic tags.</p>
      </wla-accordion>
    </div>
  `,
};

// ── Group ─────────────────────────────────────────────────────────────────────

const SUMMARY = html`
  <div style="color:var(--color-text-muted);font-size:var(--font-size-base);line-height:1.6">
    <p style="margin:0 0 12px">
      This in-depth tutorial walks through building a full design-token pipeline from
      scratch — covering the W3C DTCG format, Style Dictionary transforms, and live
      Figma Variable sync. The presenter argues that naming conventions matter more than
      the toolchain.
    </p>
    <p style="margin:0 0 12px">
      The second half covers accessibility: contrast ratios under dark mode, focus-visible
      states in Shadow DOM, and why ARIA attributes on custom elements require explicit role
      mapping that frameworks often skip entirely.
    </p>
    <p style="margin:0">
      Concludes with a live demo connecting a Lit component library to a Figma file —
      variables update in real time as token values change in code.
    </p>
  </div>
`;

const TAKEAWAYS = html`
  <ul style="margin:0;padding-left:16px;color:var(--color-text-muted);font-size:var(--font-size-base);line-height:1.7">
    <li>Token names should describe role, not value — semantic over structural.</li>
    <li>ARIA on shadow DOM requires explicit role declarations; don't rely on implicit roles.</li>
    <li>Style Dictionary + MCP closes the Figma sync loop without manual copy-paste.</li>
    <li>Contrast ratios under dark mode often fail on muted text — always check at token level.</li>
  </ul>
`;

const SENTIMENT = html`
  <div style="color:var(--color-text-muted);font-size:var(--font-size-base);line-height:1.6">
    <p style="margin:0 0 10px">87% positive · 8% neutral · 5% negative</p>
    <p style="margin:0;font-style:italic;border-left:2px solid var(--color-border);padding-left:10px;font-size:var(--font-size-sm)">
      "Finally a design-systems tutorial that doesn't skip the hard parts."
    </p>
  </div>
`;

const TAGS = html`
  <div style="display:flex;flex-wrap:wrap;gap:6px">
    ${['Design systems','Tokens','Lit','Figma','Accessibility','MCP','Shadow DOM','ARIA'].map(t => html`
      <span style="
        padding:3px 10px;border-radius:999px;
        background:var(--color-surface-raised,#242424);
        border:1px solid var(--color-border,#2e2e2e);
        color:var(--color-text-muted,#aaa);
        font-size:var(--font-size-sm,0.75rem);font-weight:600;
      ">${t}</span>
    `)}
  </div>
`;

export const Default = {
  name: 'Default (group)',
  parameters: {
    docs: {
      description: {
        story: 'All sections open, content scrolls as one region. Scroll down — the Summary header pins to the top while the headers below pin to the bottom. Every header stays reachable at all times.',
      },
      story: { height: '420px' },
    },
  },
  render: () => html`
    <div style="width:360px;height:400px;border:1px solid var(--color-border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column">
      <wla-accordion-group style="flex:1;min-height:0">
        <wla-accordion title="Summary" open>${SUMMARY}</wla-accordion>
        <wla-accordion title="Key Takeaways" open>${TAKEAWAYS}</wla-accordion>
        <wla-accordion title="Comment Sentiment" open>${SENTIMENT}</wla-accordion>
        <wla-accordion title="Contextual Tags" open>${TAGS}</wla-accordion>
      </wla-accordion-group>
    </div>
  `,
};

export const LongContent = {
  name: 'Long content (group)',
  parameters: {
    docs: {
      description: {
        story: 'Extreme case: Summary has far more content than the panel can show. Scroll through it — the other three headers stay pinned at the bottom until you reach their natural position.',
      },
      story: { height: '420px' },
    },
  },
  render: () => html`
    <div style="width:360px;height:400px;border:1px solid var(--color-border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column">
      <wla-accordion-group style="flex:1;min-height:0">
        <wla-accordion title="Summary" open>
          <div style="color:var(--color-text-muted);font-size:var(--font-size-base);line-height:1.6">
            ${Array.from({ length: 8 }, (_, i) => html`
              <p style="margin:0 0 12px">
                Paragraph ${i + 1} — the video covers advanced techniques in design-system
                architecture, token pipeline automation, and cross-platform accessibility
                that most tutorials skip. Each section builds carefully on the previous one.
              </p>
            `)}
          </div>
        </wla-accordion>
        <wla-accordion title="Key Takeaways" open>${TAKEAWAYS}</wla-accordion>
        <wla-accordion title="Comment Sentiment" open>${SENTIMENT}</wla-accordion>
        <wla-accordion title="Contextual Tags" open>${TAGS}</wla-accordion>
      </wla-accordion-group>
    </div>
  `,
};
