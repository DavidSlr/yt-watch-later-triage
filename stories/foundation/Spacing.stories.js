import { html } from 'lit';

export default {
  title: 'Foundation/Spacing',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const SPACING = [
  { token: '--space-1', value: '4px',  step: 1 },
  { token: '--space-2', value: '8px',  step: 2 },
  { token: '--space-3', value: '12px', step: 3 },
  { token: '--space-4', value: '16px', step: 4 },
  { token: '--space-5', value: '20px', step: 5 },
  { token: '--space-6', value: '24px', step: 6 },
];

const RADIUS = [
  { token: '--radius-sm',   value: '4px',    label: 'sm' },
  { token: '--radius',      value: '8px',    label: 'base' },
  { token: '--radius-full', value: '9999px', label: 'full' },
];

export const SpacingScale = {
  name: 'Spacing Scale',
  render: () => html`
    <div style="max-width:560px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:16px">Spacing</div>
      ${SPACING.map(({ token, value, step }) => html`
        <div style="display:flex;align-items:center;gap:16px;padding:6px 0">
          <div style="
            height: var(${token});
            width: var(${token});
            background: var(--color-accent, #ff0000);
            border-radius: 2px;
            flex-shrink: 0;
          "></div>
          <div style="
            height: 20px;
            background: rgba(255,0,0,0.15);
            border-radius: 2px;
            flex-shrink: 0;
            width: calc(var(${token}) * 4);
          "></div>
          <div style="font-size:12px;color:var(--color-text,#e8e8e8)">
            <span style="font-weight:600">space-${step}</span>
            <span style="color:var(--color-text-muted,#aaa);margin-left:8px;font-family:monospace">${value}</span>
            <span style="color:var(--color-text-disabled,#555);margin-left:8px;font-family:monospace;font-size:11px">${token}</span>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const BorderRadius = {
  name: 'Border Radius',
  render: () => html`
    <div style="display:flex;gap:32px;flex-wrap:wrap">
      ${RADIUS.map(({ token, value, label }) => html`
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
          <div style="
            width: 64px; height: 64px;
            background: var(--color-surface, #1a1a1a);
            border: 1px solid var(--color-border, #2e2e2e);
            border-radius: var(${token});
          "></div>
          <div style="text-align:center">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${label}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${value}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};
