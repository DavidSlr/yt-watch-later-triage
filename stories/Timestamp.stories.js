import { html } from 'lit';
import '../components/wla-timestamp.js';

export default {
  title: 'Components/Timestamp',
  component: 'wla-timestamp',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    seconds: { control: 'number' },
    label:   { control: 'text' },
  },
};

export const Default = {
  args: { seconds: 83 },
  render: ({ seconds, label }) => html`<wla-timestamp seconds=${seconds} label=${label || ''}></wla-timestamp>`,
};

export const WithHours = {
  args: { seconds: 3725 },
  render: ({ seconds }) => html`<wla-timestamp seconds=${seconds}></wla-timestamp>`,
};

export const InContext = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => html`
    <div style="width:420px;display:flex;flex-direction:column;gap:10px">
      ${[
        { ts: 12,   point: 'Web Components use Shadow DOM to encapsulate styles.' },
        { ts: 83,   point: 'CSS custom properties pierce the Shadow DOM boundary.' },
        { ts: 210,  point: 'Lit handles reactive updates efficiently with its render scheduler.' },
        { ts: 3725, point: 'Design tokens keep code and Figma in sync.' },
      ].map(({ ts, point }) => html`
        <div style="display:flex;align-items:baseline;gap:8px;font-size:0.875rem;color:var(--color-text,#e8e8e8);line-height:1.5">
          <wla-timestamp seconds=${ts} @wla-seek=${e => console.log('seek', e.detail.seconds)}></wla-timestamp>
          <span>${point}</span>
        </div>
      `)}
    </div>
  `,
};
