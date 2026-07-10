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
      { name: '--color-border-hover', value: '#444444', label: 'border-hover' },
      { name: '--color-border-focus', value: '#4a5a75', label: 'border-focus' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: '--color-text',           value: '#e8e8e8', label: 'text' },
      { name: '--color-text-muted',     value: '#aaaaaa', label: 'text-muted' },
      { name: '--color-text-disabled',  value: '#555555', label: 'text-disabled' },
      { name: '--color-text-on-accent', value: '#ffffff', label: 'text-on-accent' },
    ],
  },
  {
    label: 'Accent',
    tokens: [
      { name: '--color-accent',              value: '#28ada0',              label: 'accent' },
      { name: '--color-accent-hover',        value: '#3dccbe',              label: 'accent-hover' },
      { name: '--color-accent-active',       value: '#1c877d',              label: 'accent-active' },
      { name: '--color-accent-solid',        value: '#1b7e74',              label: 'accent-solid' },
      { name: '--color-accent-solid-hover',  value: '#176d65',              label: 'accent-solid-hover' },
      { name: '--color-accent-solid-active', value: '#10564f',              label: 'accent-solid-active' },
      { name: '--color-accent-subtle',       value: 'rgba(40,173,160,0.08)', label: 'accent-subtle' },
      { name: '--color-accent-subtle-hover', value: 'rgba(40,173,160,0.22)', label: 'accent-subtle-hover' },
    ],
  },
  {
    label: 'Status',
    tokens: [
      { name: '--color-success',             value: '#28ada0',              label: 'success (→ accent)' },
      { name: '--color-success-bg',          value: 'rgba(40,173,160,0.08)', label: 'success-bg (→ accent-subtle)' },
      { name: '--color-warning',             value: '#d4963a',              label: 'warning' },
      { name: '--color-warning-bg',          value: 'rgba(212,150,30,0.15)', label: 'warning-bg' },
      { name: '--color-critical',            value: '#e5484d',              label: 'critical' },
      { name: '--color-critical-hover',      value: '#c93f43',              label: 'critical-hover' },
      { name: '--color-critical-bg',         value: '#2e1314',              label: 'critical-bg' },
      { name: '--color-critical-ghost-hover',value: 'rgba(229,72,77,0.9)', label: 'critical-ghost-hover' },
      { name: '--color-info',                value: '#9fc1ff',              label: 'info' },
    ],
  },
];

const swatch = ({ name, value, label }) => html`
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
    <div style="max-width:900px">
      ${GROUPS.map(group)}
    </div>
  `,
};
