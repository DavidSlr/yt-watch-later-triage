import { html } from 'lit';
import '../components/wla-menu.js';

export default {
  title: 'Components/Menu',
  component: 'wla-menu',
  tags: ['autodocs'],
  parameters: { layout: 'padded', docs: { story: { height: '200px' } } },
  argTypes: {
    open:  { control: 'boolean' },
    label: { control: 'text' },
  },
};

export const Default = {
  args: { open: true, label: 'Video options' },
  render: ({ open, label }) => html`
    <div style="display:flex;justify-content:flex-end;padding:16px">
      <wla-menu ?open=${open} label=${label}>
        <button>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
          </svg>
          Inspect data
        </button>
      </wla-menu>
    </div>
  `,
};

export const MultipleItems = {
  args: { open: true },
  render: ({ open }) => html`
    <div style="display:flex;justify-content:flex-end;padding:16px">
      <wla-menu ?open=${open} label="More options">
        <button>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
          </svg>
          Inspect data
        </button>
        <button>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
          </svg>
          Open on YouTube
        </button>
      </wla-menu>
    </div>
  `,
};
