import { html } from 'lit';
import '../components/wla-section.js';
import '../components/wla-form-field.js';
import '../components/wla-chip.js';

export default {
  title: 'Components/Section',
  component: 'wla-section',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Composes [`wla-chip`](?path=/story/components-chip--neutral) in the action slot for status indicators, and [`wla-form-field`](?path=/story/components-formfield--text) in the body slot for settings forms.' } },
  },
  argTypes: {
    heading: { control: 'text' },
  },
};

export const ProviderConfig = {
  args: { heading: 'Google Gemini' },
  render: ({ heading }) => html`
    <div style="width:380px">
      <wla-section heading=${heading}>
        <wla-form-field label="API Key" type="password" placeholder="Paste your API key"></wla-form-field>
        <wla-form-field label="Model" placeholder="gemini-2.5-flash"></wla-form-field>
      </wla-section>
    </div>
  `,
};

export const TranscriptHarvester = {
  render: () => html`
    <div style="width:380px">
      <wla-section heading="Transcript harvester">
        <wla-form-field label="Service URL" type="url" placeholder="http://localhost:47823"></wla-form-field>
        <wla-chip state="success" value="online" label="Harvester Status"></wla-chip>
      </wla-section>
    </div>
  `,
};

export const Stacked = {
  render: () => html`
    <div style="width:380px;display:flex;flex-direction:column;gap:16px">
      <wla-section heading="Google Gemini">
        <wla-form-field label="API Key" type="password" placeholder="Paste your API key"></wla-form-field>
        <wla-form-field label="Model" placeholder="gemini-2.5-flash"></wla-form-field>
      </wla-section>
      <wla-section heading="Transcript harvester">
        <wla-form-field label="Service URL" type="url" placeholder="http://localhost:47823"></wla-form-field>
        <wla-chip state="warning" value="offline" label="Harvester Status"></wla-chip>
      </wla-section>
    </div>
  `,
};
