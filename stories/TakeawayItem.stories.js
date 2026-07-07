import { html } from 'lit';
import '../components/wla-timestamp.js';

export default {
  title: 'Patterns/Takeaway Item',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Composes [`wla-timestamp`](?path=/story/components-timestamp--default) for the seekable time link.' } },
  },
};

const typeStyle = `
  font-size: var(--font-size-sm, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-disabled, #555);
  white-space: nowrap;
`;

const worthWatchingStyle = `
  font-size: var(--font-size-sm, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-success, #2d7a2d);
  white-space: nowrap;
`;

const item = ({ label, point, ts }) => html`
  <div style="
    display: flex;
    flex-direction: column;
    gap: var(--space-1, 4px);
    padding: var(--space-3, 12px) 0;
    border-bottom: 1px solid var(--color-border, #2e2e2e);
  ">
    <div style="display:flex;align-items:center;gap:var(--space-2,8px)">
      ${ts != null ? html`<wla-timestamp seconds=${ts}></wla-timestamp>` : ''}
      <span style=${label === 'worth watching' ? worthWatchingStyle : typeStyle}>${label}</span>
    </div>
    <p style="
      margin: 0;
      font-size: var(--font-size-base, 0.875rem);
      line-height: var(--line-height-base, 1.45);
      color: var(--color-text, #e8e8e8);
    ">${point}</p>
  </div>
`;

export const Simple = {
  render: () => item({
    label: 'simple',
    point: 'The library uses a virtual DOM diffing algorithm to minimise re-renders.',
    ts: 83,
  }),
};

export const WorthWatching = {
  render: () => item({
    label: 'worth watching',
    point: 'The author shows a subtle gotcha with closures inside loops that trips up most developers — watch the live demo.',
    ts: 312,
  }),
};

export const NoTimestamp = {
  render: () => item({
    label: 'simple',
    point: 'This video covers fundamentals only — no advanced patterns discussed.',
    ts: null,
  }),
};

const ITEMS = [
  { label: 'simple',         point: 'Shadow DOM encapsulates styles so they never leak out to the page.',                                                              ts: 12  },
  { label: 'worth watching', point: "The speaker's live refactor from class components to hooks is the clearest explanation I've seen — pay close attention.",         ts: 210 },
  { label: 'simple',         point: 'CSS custom properties pierce the shadow boundary, making design tokens the right tool for theming.',                              ts: 445 },
  { label: 'worth watching', point: 'The performance comparison at the end challenges the "always use a framework" assumption with real numbers.',                     ts: 918 },
  { label: 'simple',         point: "Lit's render scheduler batches updates into a single microtask.",                                                                 ts: null },
];

export const List = {
  render: () => html`
    <div style="width:480px">
      ${ITEMS.map(i => item(i))}
    </div>
  `,
};
