import { html } from 'lit';
import '../components/wla-form-field.js';

export default {
  title: 'Components/FormField',
  component: 'wla-form-field',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    label:       { control: 'text' },
    hint:        { control: 'text' },
    type:        { control: 'select', options: ['text', 'password', 'url'] },
    placeholder: { control: 'text' },
    state:       { control: 'select', options: ['default', 'readonly', 'disabled'] },
  },
};

const field = (args) => html`
  <div style="width:360px">
    <wla-form-field
      label=${args.label ?? ''}
      hint=${args.hint ?? ''}
      type=${args.type ?? 'text'}
      placeholder=${args.placeholder ?? ''}
      state=${args.state ?? 'default'}
    ></wla-form-field>
  </div>
`;

export const Text = {
  args: { label: 'Model', type: 'text', placeholder: 'gemini-2.5-flash', state: 'default' },
  render: field,
};

export const WithHint = {
  args: {
    label: 'Model',
    type: 'text',
    placeholder: 'gemini-2.5-flash',
    hint: 'Check your provider docs for available model IDs.',
    state: 'default',
  },
  render: field,
};

export const Password = {
  args: {
    label: 'API Key',
    type: 'password',
    placeholder: 'Paste your API key',
    hint: 'Find this in your provider dashboard under API settings.',
    state: 'default',
  },
  render: field,
};

export const Readonly = {
  args: { label: 'Model', type: 'text', placeholder: '', state: 'readonly' },
  render: (args) => html`
    <div style="width:360px">
      <wla-form-field
        label=${args.label}
        hint=${args.hint ?? ''}
        type=${args.type}
        placeholder=${args.placeholder}
        state=${args.state}
        value="gemini-2.5-flash"
      ></wla-form-field>
    </div>
  `,
};

export const Disabled = {
  args: { label: 'API Key', type: 'password', placeholder: 'Paste your API key', state: 'disabled' },
  render: field,
};
