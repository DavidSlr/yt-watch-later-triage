import { html } from 'lit';
// Raw source text, not the parsed stylesheet — lets this story read the
// actual token declarations (names, values, comment-based grouping)
// directly, instead of a hand-maintained copy that drifts out of sync
// every time a token is added, renamed, or removed.
import tokensRaw from '../../tokens/tokens.css?raw';

export default {
  title: 'Foundation/Colors',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

// Walks the :root block and buckets every --color-* declaration under the
// nearest preceding comment (e.g. "/* Borders */", "/* ── Colors ── */").
// Any new --color-* token shows up automatically under whatever heading
// precedes it in tokens.css — no second list to remember to update.
function parseColorGroups(css) {
  const body = css.slice(css.indexOf(':root'));
  const groups = [];
  let current = null;

  for (const raw of body.split('\n')) {
    const line = raw.trim();

    if (line.startsWith('/*') && line.endsWith('*/')) {
      const label = line.slice(2, -2).replace(/─/g, '').trim();
      if (label) current = { label, tokens: [] };
      if (label) groups.push(current);
      continue;
    }

    const match = line.match(/^(--color-[a-zA-Z0-9-]+)\s*:\s*([^;]+);/);
    if (match && current) {
      current.tokens.push({ name: match[1], value: match[2].trim() });
    }
  }

  return groups.filter(g => g.tokens.length > 0);
}

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

const GROUPS = parseColorGroups(tokensRaw);

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
