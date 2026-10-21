import { html } from 'lit';
import '../components/wla-analyzing.js';

export default {
  title: 'Components/Analyzing',
  component: 'wla-analyzing',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
  },
};

export const Default = {
  args: { label: 'Analyzing video' },
  render: ({ label }) => html`<wla-analyzing label=${label}></wla-analyzing>`,
};
