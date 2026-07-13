import { html } from 'lit';
// Raw source text, not the parsed stylesheet — lets this story read the
// actual token declarations (names, values, comment-based grouping)
// directly, instead of a hand-maintained copy that drifts out of sync
// every time a token is added, renamed, or removed.
import tokensRaw from '../../tokens/tokens.css?raw';
import { parseTokenGroups } from './_parseTokens.js';

export default {
  title: 'Foundation/Colors',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const swatch = ({ name, value }) => html`
  <div style="display:flex;flex-direction:column;gap:6px;min-width:100px">
    <div style="
      height: 56px;
      border-radius: 6px;
      background: ${value};
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2);
    "></div>
    <div>
      <div style="font-size:12px;font-weight:600;color:var(--color-text,#e8e8e8)">${name.replace('--color-', '')}</div>
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

const GROUPS = parseTokenGroups(tokensRaw, '--color-');

export const AllColors = {
  name: 'All Colors',
  parameters: {
    docs: {
      description: {
        story: `Generated directly from tokens/tokens.css — grouped by that file's own comments, values taken from the actual declarations. Add, rename, or remove a token there and this updates on its own; there is no second list to keep in sync.`,
      },
    },
  },
  render: () => html`
    <div style="max-width:900px">
      ${GROUPS.map(group)}
    </div>
  `,
};
