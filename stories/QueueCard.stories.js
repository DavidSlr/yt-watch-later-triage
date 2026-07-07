import { html } from 'lit';
import '../components/wla-queue-card.js';

const THUMB = 'https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg';

export default {
  title: 'Components/QueueCard',
  component: 'wla-queue-card',
  tags: ['autodocs'],
  argTypes: {
    title:     { control: 'text' },
    channel:   { control: 'text' },
    duration:  { control: 'text' },
    date:      { control: 'text' },
    active:    { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
};

const defaults = {
  thumbnail: THUMB,
  title: 'How I built a design system with Web Components',
  channel: 'David Schneller',
  duration: '14:32',
  date: '2 weeks ago',
  active: false,
};

export const Default = {
  args: defaults,
  render: ({ thumbnail, title, channel, duration, date, active }) => html`
    <div style="height:220px;display:flex;align-items:stretch">
      <wla-queue-card
        thumbnail=${thumbnail}
        title=${title}
        channel=${channel}
        duration=${duration}
        date=${date}
        ?active=${active}
      ></wla-queue-card>
    </div>
  `,
};

export const Active = {
  args: { ...defaults, active: true },
  render: ({ thumbnail, title, channel, duration, date, active }) => html`
    <div style="height:220px;display:flex;align-items:stretch">
      <wla-queue-card
        thumbnail=${thumbnail}
        title=${title}
        channel=${channel}
        duration=${duration}
        date=${date}
        ?active=${active}
      ></wla-queue-card>
    </div>
  `,
};

export const Queue = {
  render: () => html`
    <div style="display:flex;gap:8px;height:220px;padding:8px;background:var(--color-bg)">
      ${[
        { title: 'Web Components in 2025', channel: 'Fireship', duration: '8:14' },
        { title: 'How I built a design system with Web Components and Storybook', channel: 'David Schneller', duration: '14:32' },
        { title: 'Figma Variables Deep Dive', channel: 'DesignCode', duration: '22:07' },
        { title: 'LitElement Tutorial', channel: 'Academind', duration: '31:45' },
      ].map((v, i) => html`
        <wla-queue-card
          thumbnail=${THUMB}
          title=${v.title}
          channel=${v.channel}
          duration=${v.duration}
          ?active=${i === 1}
        ></wla-queue-card>
      `)}
    </div>
  `,
};
