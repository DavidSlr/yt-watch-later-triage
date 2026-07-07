import { html } from 'lit';
import '../components/wla-spinner.js';

export default {
  title: 'Components/Spinner',
  component: 'wla-spinner',
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export const Medium = {
  args: { size: 'md' },
  render: ({ size }) => html`<wla-spinner size=${size}></wla-spinner>`,
};

export const AllSizes = {
  render: () => html`
    <div style="display:flex;gap:20px;align-items:center">
      <wla-spinner size="sm"></wla-spinner>
      <wla-spinner size="md"></wla-spinner>
      <wla-spinner size="lg"></wla-spinner>
    </div>
  `,
};
