import { html } from 'lit';
import '../components/wla-button.js';

export default {
  title: 'Components/Button',
  component: 'wla-button',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    variant:  { control: 'select', options: ['primary', 'secondary', 'link'] },
    size:     { control: 'select', options: ['md', 'sm'] },
    disabled: { control: 'boolean' },
    icon:     { control: 'select', options: ['', 'refresh', 'settings', 'close', 'play', 'arrow-left', 'arrow-right'] },
    text:     { control: 'text', description: 'Slotted button text (not a component prop)' },
  },
  args: { text: 'Click me', variant: 'primary', size: 'md', disabled: false, icon: '' },
};

const btn = ({ variant, size, disabled, text, icon }) => html`
  <wla-button variant=${variant} size=${size} ?disabled=${disabled} icon=${icon ?? ''}>${text}</wla-button>
`;

export const Primary = {
  args: { variant: 'primary' },
  render: btn,
};

export const Secondary = {
  args: { variant: 'secondary' },
  render: btn,
};

export const Link = {
  args: { variant: 'link', text: 'Learn more' },
  render: btn,
};

export const WithIcon = {
  name: 'With icon (left)',
  args: { variant: 'primary', icon: 'refresh', text: 'Refresh' },
  render: btn,
};

export const IconOnly = {
  name: 'Icon only',
  render: () => html`
    <wla-button variant="secondary" icon="settings" icon-only label="AI settings"></wla-button>
  `,
};

export const Disabled = {
  args: { variant: 'primary', disabled: true, icon: 'refresh', text: 'Refresh' },
  render: btn,
};

export const Sizes = {
  name: 'Sizes (md vs sm)',
  render: () => html`
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
      <wla-button variant="secondary" icon="refresh">Refresh (md)</wla-button>
      <wla-button variant="secondary" size="sm" icon="refresh">Refresh (sm)</wla-button>
      <wla-button variant="secondary" icon="arrow-left" icon-only label="Previous"></wla-button>
      <wla-button variant="secondary" size="sm" icon="arrow-left" icon-only label="Previous"></wla-button>
    </div>
  `,
};

export const AllVariants = {
  name: 'All variants',
  render: () => html`
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <wla-button variant="primary"   icon="refresh">Refresh</wla-button>
      <wla-button variant="secondary" icon="settings" icon-only label="Settings"></wla-button>
      <wla-button variant="secondary" icon="arrow-right">Next</wla-button>
      <wla-button variant="link">Learn more</wla-button>
      <wla-button variant="primary"   disabled icon="refresh">Refresh</wla-button>
    </div>
  `,
};
