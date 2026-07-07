import { html } from 'lit';

export default {
  title: 'Foundation/Shadows',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const SHADOWS = [
  {
    token: '--shadow-sm',
    value: '0 2px 8px rgba(0,0,0,0.3)',
    label: 'sm',
    usage: 'Cards, chips, subtle elevation',
  },
  {
    token: '--shadow-md',
    value: '0 4px 16px rgba(0,0,0,0.5)',
    label: 'md',
    usage: 'Modals, dropdowns, overlays',
  },
];

const TRANSITIONS = [
  { token: '--transition-fast', value: '0.12s ease', label: 'fast', usage: 'Hover states, micro interactions' },
  { token: '--transition-base', value: '0.2s ease',  label: 'base', usage: 'Panel open/close, larger transitions' },
];

export const ElevationScale = {
  name: 'Elevation',
  render: () => html`
    <div style="display:flex;gap:32px;flex-wrap:wrap;padding:16px 0">
      ${SHADOWS.map(({ token, value, label, usage }) => html`
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="
            width: 160px; height: 80px;
            background: var(--color-surface, #1a1a1a);
            border-radius: var(--radius, 8px);
            box-shadow: var(${token});
            border: 1px solid var(--color-border, #2e2e2e);
          "></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${label}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace;margin-top:2px">${token}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${value}</div>
            <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:4px">${usage}</div>
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
        .trans-demo:hover { background:var(--color-accent,#ff0000); }
        .trans-fast { transition: background var(--transition-fast, 0.12s ease); }
        .trans-base { transition: background var(--transition-base, 0.2s ease); }
      </style>
      ${TRANSITIONS.map(({ token, value, label, usage }) => html`
        <div style="display:flex;align-items:center;gap:20px;padding:12px 0;border-bottom:1px solid var(--color-border,#2e2e2e)">
          <div class="trans-demo trans-${label}" title="Hover me"></div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${label} · ${value}</div>
            <div style="font-size:11px;color:var(--color-text-muted,#aaa);font-family:monospace">${token}</div>
            <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:2px">${usage}</div>
          </div>
        </div>
      `)}
      <div style="font-size:11px;color:var(--color-text-disabled,#555);margin-top:12px">Hover the squares to preview each transition speed.</div>
    </div>
  `,
};
