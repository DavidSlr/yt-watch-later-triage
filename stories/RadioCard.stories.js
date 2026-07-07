import { html } from 'lit';
import '../components/wla-radio-card.js';

export default {
  title: 'Components/RadioCard',
  component: 'wla-radio-card',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    label:    { control: 'text' },
    sublabel: { control: 'text' },
    checked:  { control: 'boolean' },
  },
};

export const Default = {
  args: { label: 'Google Gemini', sublabel: 'Free tier · ~250 req/day', checked: false },
  render: ({ label, sublabel, checked }) => html`
    <div style="width:360px">
      <wla-radio-card name="demo-a" value="gemini" label=${label} sublabel=${sublabel} ?checked=${checked}></wla-radio-card>
    </div>
  `,
};

export const Checked = {
  args: { label: 'Google Gemini', sublabel: 'Free tier · ~250 req/day', checked: true },
  render: ({ label, sublabel, checked }) => html`
    <div style="width:360px">
      <wla-radio-card name="demo-b" value="gemini" label=${label} sublabel=${sublabel} ?checked=${checked}></wla-radio-card>
    </div>
  `,
};

export const VerticalStack = {
  render: () => html`
    <div style="width:360px;display:flex;flex-direction:column;gap:8px">
      <wla-radio-card name="provider-v" value="gemini" label="Google Gemini"    sublabel="Free tier · ~250 req/day"          checked></wla-radio-card>
      <wla-radio-card name="provider-v" value="claude" label="Anthropic Claude" sublabel="Paid · Haiku ≈ $0.001–0.01/video"></wla-radio-card>
      <wla-radio-card name="provider-v" value="openai" label="OpenAI"           sublabel="Paid · GPT-4o mini available"></wla-radio-card>
    </div>
  `,
};

export const HorizontalStack = {
  render: () => html`
    <div style="display:flex;gap:8px;width:480px">
      <wla-radio-card name="provider-h" value="gemini" label="Google Gemini"    sublabel="Free tier · ~250 req/day"      checked></wla-radio-card>
      <wla-radio-card name="provider-h" value="claude" label="Anthropic Claude" sublabel="Paid · Haiku ≈ $0.001/video"></wla-radio-card>
      <wla-radio-card name="provider-h" value="openai" label="OpenAI"           sublabel="Paid · GPT-4o mini"></wla-radio-card>
    </div>
  `,
};
