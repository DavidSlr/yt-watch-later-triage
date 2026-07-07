import { html } from 'lit';
import '../components/wla-chip.js';

export default {
  title: 'Components/Chip',
  component: 'wla-chip',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    value: { control: 'text' },
    label: { control: 'text' },
    state: { control: 'select', options: ['neutral', 'success', 'warning', 'critical', 'disabled'] },
  },
};

export const Neutral = {
  args: { value: 'Programming', state: 'neutral' },
  render: ({ value, label, state }) => html`<wla-chip value=${value} label=${label ?? ''} state=${state}></wla-chip>`,
};

export const Success = {
  args: { value: 'online', state: 'success' },
  render: ({ value, label, state }) => html`<wla-chip value=${value} label=${label ?? ''} state=${state}></wla-chip>`,
};

export const Warning = {
  args: { value: 'offline', state: 'warning' },
  render: ({ value, label, state }) => html`<wla-chip value=${value} label=${label ?? ''} state=${state}></wla-chip>`,
};

export const Critical = {
  args: { value: 'error', state: 'critical' },
  render: ({ value, label, state }) => html`<wla-chip value=${value} label=${label ?? ''} state=${state}></wla-chip>`,
};

export const Disabled = {
  args: { value: 'unavailable', state: 'disabled' },
  render: ({ value, label, state }) => html`<wla-chip value=${value} label=${label ?? ''} state=${state}></wla-chip>`,
};

export const WithLabel = {
  args: { value: 'online', label: 'Harvester Status', state: 'success' },
  render: ({ value, label, state }) => html`<wla-chip value=${value} label=${label} state=${state}></wla-chip>`,
};

export const TagCloud = {
  render: () => html`
    <div style="display:flex;flex-wrap:wrap;gap:6px;max-width:360px">
      <wla-chip value="Programming"     state="neutral"></wla-chip>
      <wla-chip value="Tutorial"        state="neutral"></wla-chip>
      <wla-chip value="Web Dev"         state="neutral"></wla-chip>
      <wla-chip value="Open Source"     state="neutral"></wla-chip>
      <wla-chip value="Design Systems"  state="neutral"></wla-chip>
      <wla-chip value="AI"              state="neutral"></wla-chip>
      <wla-chip value="Performance"     state="neutral"></wla-chip>
      <wla-chip value="worth watching"  state="success"></wla-chip>
      <wla-chip value="TypeScript"      state="neutral"></wla-chip>
    </div>
  `,
};
