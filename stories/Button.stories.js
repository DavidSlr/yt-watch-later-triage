import { html } from 'lit';
import '../components/wla-button.js';

export default {
  title: 'Components/Button',
  component: 'wla-button',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    variant:  { control: 'select', options: ['primary', 'secondary', 'link'] },
    disabled: { control: 'boolean' },
    icon:     { control: 'select', options: ['', 'refresh', 'settings', 'close', 'play', 'arrow-left', 'arrow-right'] },
    label:    { control: 'text' },
  },
  args: { label: 'Click me', disabled: false, icon: '' },
};

const btn = ({ variant, disabled, label, icon }) => html`
  <wla-button variant=${variant} ?disabled=${disabled} icon=${icon ?? ''}>${label}</wla-button>
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
  args: { variant: 'link', label: 'Learn more' },
  render: btn,
};

export const WithIcon = {
  name: 'With icon (left)',
  args: { variant: 'primary', icon: 'refresh', label: 'Refresh' },
  render: btn,
};

export const IconOnly = {
  name: 'Icon only',
  args: { variant: 'secondary', icon: 'settings', label: '' },
  render: btn,
};

export const Disabled = {
  args: { variant: 'primary', disabled: true, icon: 'refresh', label: 'Refresh' },
  render: btn,
};

export const AllVariants = {
  name: 'All variants',
  render: () => html`
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <wla-button variant="primary"   icon="refresh">Refresh</wla-button>
      <wla-button variant="secondary" icon="settings"></wla-button>
      <wla-button variant="secondary" icon="arrow-right">Next</wla-button>
      <wla-button variant="link">Learn more</wla-button>
      <wla-button variant="primary"   disabled icon="refresh">Refresh</wla-button>
    </div>
  `,
};
