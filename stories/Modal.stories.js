import { html } from 'lit';
import '../components/wla-modal.js';
import '../components/wla-button.js';
import '../components/wla-form-field.js';
import '../components/wla-radio-card.js';

export default {
  title: 'Components/Modal',
  component: 'wla-modal',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { story: { height: '520px' } },
  },
  argTypes: {
    heading: { control: 'text' },
    open:    { control: 'boolean' },
  },
};

export const Default = {
  args: { heading: 'AI Settings', open: true },
  render: ({ heading, open }) => html`
    <div style="
      min-height: 520px;
      background: var(--color-bg, #0f0f0f);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    ">
      <p style="color: var(--color-text-muted, #aaa); font-size: 0.875rem">
        Background content behind the modal
      </p>
      <wla-modal heading=${heading} ?open=${open}>
        <div style="display:flex;flex-direction:column;gap:12px">
          <wla-radio-card name="provider" value="gemini"
            label="Google Gemini" sublabel="Free tier · ~250 req/day" checked>
          </wla-radio-card>
          <wla-radio-card name="provider" value="claude"
            label="Anthropic Claude" sublabel="Paid · Haiku ≈ $0.001–0.01/video">
          </wla-radio-card>
          <wla-form-field label="API Key" type="password" placeholder="Paste your API key"></wla-form-field>
        </div>
        <wla-button slot="footer" variant="secondary">Test</wla-button>
        <wla-button slot="footer" variant="primary">Save</wla-button>
      </wla-modal>
    </div>
  `,
};

export const Interactive = {
  render: () => {
    let open = false;
    const toggle = (e) => {
      open = !open;
      e.currentTarget.closest('[data-story]')
        .querySelector('wla-modal').open = open;
    };
    return html`
      <div data-story style="
        min-height: 520px;
        background: var(--color-bg, #0f0f0f);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <wla-button variant="secondary" @click=${toggle}>Open settings</wla-button>
        <wla-modal heading="AI Settings" @wla-close=${(e) => { open = false; e.target.open = false; }}>
          <div style="display:flex;flex-direction:column;gap:12px">
            <wla-radio-card name="provider" value="gemini"
              label="Google Gemini" sublabel="Free tier · ~250 req/day" checked>
            </wla-radio-card>
            <wla-radio-card name="provider" value="claude"
              label="Anthropic Claude" sublabel="Paid · Haiku ≈ $0.001–0.01/video">
            </wla-radio-card>
            <wla-form-field label="API Key" type="password" placeholder="Paste your API key"></wla-form-field>
          </div>
          <wla-button slot="footer" variant="secondary">Test</wla-button>
          <wla-button slot="footer" variant="primary">Save</wla-button>
        </wla-modal>
      </div>
    `;
  },
};

