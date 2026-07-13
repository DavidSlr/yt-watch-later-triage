import { html } from 'lit';
import tokensRaw from '../../tokens/tokens.css?raw';
import { parseTokenGroups } from './_parseTokens.js';

export default {
  title: 'Foundation/Shadows',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

// Usage descriptions have no equivalent in tokens.css — they're editorial,
// not a value — so they stay hand-authored here, keyed by token name.
// Everything else (which tokens exist, their values) is parsed straight
// from tokens.css and can't drift out of sync with it.
const USAGE = {
  '--shadow-sm': 'Cards, chips, subtle elevation',
  '--shadow-md': 'Modals, dropdowns, overlays',
  '--transition-fast': 'Hover states, micro interactions',
  '--transition-base': 'Panel open/close, larger transitions',
};

const SHADOWS = parseTokenGroups(tokensRaw, '--shadow-')[0]?.tokens ?? [];
const TRANSITIONS = parseTokenGroups(tokensRaw, '--transition-')[0]?.tokens ?? [];

export const ElevationScale = {
  name: 'Elevation',
  render: () => html`
    <div style="display:flex;gap:32px;flex-wrap:wrap;padding:16px 0">
      ${SHADOWS.map(({ name, value }) => html`
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="
            width: 160px; height: 80px;
            background: var(--color-surface, #1a1a1a);
            border-radius: var(--radius, 8px);
            box-shadow: var(${name});
            border: 1px solid var(--color-border, #2e2e2e);
          "></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name.replace('--shadow-', '')}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace;margin-top:2px">${name}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${value}</div>
            <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:4px">${USAGE[name] ?? ''}</div>
          </div>
        </div>
      `)}
    </div>
  `,
};

export const Transitions = {
  render: () => html`
    <div style="max-width:480px">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--color-text-muted,#aaa);margin-bottom:16px">Transitions</div>
      <style>
        .trans-demo { width:48px;height:48px;border-radius:var(--radius,8px);background:var(--color-surface,#1a1a1a);border:1px solid var(--color-border,#2e2e2e); }
        .trans-demo:hover { background:var(--color-accent,#28ada0); }
        .trans-fast { transition: background var(--transition-fast, 0.12s ease); }
        .trans-base { transition: background var(--transition-base, 0.2s ease); }
      </style>
      ${TRANSITIONS.map(({ name, value }) => html`
        <div style="display:flex;align-items:center;gap:20px;padding:12px 0;border-bottom:1px solid var(--color-border,#2e2e2e)">
          <div class="trans-demo trans-${name.replace('--transition-', '')}" title="Hover me"></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name.replace('--transition-', '')} · ${value}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${name}</div>
            <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:2px">${USAGE[name] ?? ''}</div>
          </div>
        </div>
      `)}
      <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:12px">Hover the squares to preview each transition speed.</div>
    </div>
  `,
};
