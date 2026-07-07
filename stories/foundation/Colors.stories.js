import { html } from 'lit';

export default {
  title: 'Foundation/Colors',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const GROUPS = [
  {
    label: 'Backgrounds',
    tokens: [
      { name: '--color-bg',             value: '#0f0f0f',  label: 'bg' },
      { name: '--color-surface',        value: '#1a1a1a',  label: 'surface' },
      { name: '--color-surface-hover',  value: '#222222',  label: 'surface-hover' },
      { name: '--color-surface-raised', value: '#242424',  label: 'surface-raised' },
    ],
  },
  {
    label: 'Borders',
    tokens: [
      { name: '--color-border',       value: '#2e2e2e', label: 'border' },
      { name: '--color-border-focus', value: '#4a5a75', label: 'border-focus' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: '--color-text',          value: '#e8e8e8', label: 'text' },
      { name: '--color-text-muted',    value: '#aaaaaa', label: 'text-muted' },
      { name: '--color-text-disabled', value: '#555555', label: 'text-disabled' },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { name: '--color-accent',       value: '#ff0000', label: 'accent' },
      { name: '--color-accent-hover', value: '#cc0000', label: 'accent-hover' },
    ],
  },
  {
    label: 'Status',
    tokens: [
      { name: '--color-success',    value: '#2d7a2d', label: 'success' },
      { name: '--color-success-bg', value: '#e6f4e6', label: 'success-bg' },
      { name: '--color-warning',    value: '#a05c00', label: 'warning' },
      { name: '--color-warning-bg', value: '#fff3e0', label: 'warning-bg' },
      { name: '--color-error',      value: '#b00020', label: 'error' },
      { name: '--color-error-bg',   value: '#fce4e4', label: 'error-bg' },
      { name: '--color-info',       value: '#9fc1ff', label: 'info' },
    ],
  },
  {
    label: 'Sentiment',
    tokens: [
      { name: '--color-sentiment-positive', value: '#4ade80', label: 'sentiment-positive' },
      { name: '--color-sentiment-negative', value: '#f87171', label: 'sentiment-negative' },
      { name: '--color-sentiment-neutral',  value: '#555555', label: 'sentiment-neutral (→ text-disabled)' },
    ],
  },
];

const swatch = ({ name, value, label }) => {
  const isLight = parseInt(value.slice(1), 16) > 0x888888;
  return html`
    <div style="display:flex;flex-direction:column;gap:6px;min-width:100px">
      <div style="
        height: 56px;
        border-radius: 6px;
        background: ${value};
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2);
      "></div>
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${label}</div>
        <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${value}</div>
        <div style="font-size:10px;color:var(--color-text-disabled,#555);font-family:monospace;margin-top:2px">${name}</div>
      </div>
    </div>
  `;
};

const group = ({ label, tokens }) => html`
  <div style="margin-bottom:32px">
    <div style="
      font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;
      color:var(--color-text-muted,#aaa);margin-bottom:12px;
    ">${label}</div>
    <div style="display:flex;flex-wrap:wrap;gap:16px">
      ${tokens.map(swatch)}
    </div>
  </div>
`;

export const AllColors = {
  name: 'All Colors',
  render: () => html`
    <div style="max-width:800px">
      ${GROUPS.map(group)}
    </div>
  `,
};
