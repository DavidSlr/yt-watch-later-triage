// Shared by the Foundation stories: walks tokens.css's :root block and
// groups declarations by whichever comment precedes them (e.g. "/* Borders
// */", "/* ── Colors ── */"). Any token matching `match` shows up
// automatically under its section heading — no story hand-copies token
// values into a second list that can drift out of sync with tokens.css.
export function parseTokenGroups(css, match) {
  const test = typeof match === 'function'
    ? match
    : (name) => (Array.isArray(match) ? match : [match]).some(p => name.startsWith(p));

  const body = css.slice(css.indexOf(':root'));
  const groups = [];
  let current = null;

  for (const raw of body.split('\n')) {
    const line = raw.trim();

    if (line.startsWith('/*') && line.endsWith('*/')) {
      const label = line.slice(2, -2).replace(/─/g, '').trim();
      if (label) { current = { label, tokens: [] }; groups.push(current); }
      continue;
    }

    const decl = line.match(/^(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?\s*$/);
    if (decl && current && test(decl[1])) {
      current.tokens.push({ name: decl[1], value: decl[2].trim(), note: decl[3]?.trim() ?? '' });
    }
  }

  return groups.filter(g => g.tokens.length > 0);
}
