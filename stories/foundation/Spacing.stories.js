import { html } from 'lit';
import tokensRaw from '../../tokens/tokens.css?raw';
import { parseTokenGroups } from './_parseTokens.js';

export default {
  title: 'Foundation/Spacing',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const SPACING = parseTokenGroups(tokensRaw, '--space-')[0]?.tokens ?? [];
const RADIUS = parseTokenGroups(tokensRaw, '--radius')[0]?.tokens ?? [];

export const SpacingScale = {
  name: 'Spacing Scale',
  render: () => html`
    <div style="max-width:560px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:16px">Spacing</div>
      ${SPACING.map(({ name, value }) => html`
        <div style="display:flex;align-items:center;gap:16px;padding:6px 0">
          <div style="
            height: var(${name});
            width: var(${name});
            background: var(--color-accent, #28ada0);
            border-radius: 2px;
            flex-shrink: 0;
          "></div>
          <div style="
            height: 20px;
            background: var(--color-accent-subtle, rgba(40,173,160,0.15));
            border-radius: 2px;
            flex-shrink: 0;
            width: calc(var(${name}) * 4);
          "></div>
          <div style="font-size:12px;color:var(--color-text,#e8e8e8)">
            <span style="font-weight:600">${name.replace('--space-', 'space-')}</span>
            <span style="color:var(--color-text-muted,#aaa);margin-left:8px;font-family:monospace">${value}</span>
            <span style="color:var(--color-text-disabled,#555);margin-left:8px;font-family:monospace;font-size:11px">${name}</span>
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
      ${RADIUS.map(({ name, value }) => html`
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
          <div style="
            width: 64px; height: 64px;
            background: var(--color-surface, #1a1a1a);
            border: 1px solid var(--color-border, #2e2e2e);
            border-radius: var(${name});
          "></div>
          <div style="text-align:center">
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name.replace('--radius-', '').replace('--radius', 'base')}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${value}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};
