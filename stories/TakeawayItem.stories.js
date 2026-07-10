import { html } from 'lit';
import '../components/wla-takeaway.js';

export default {
  title: 'Components/Takeaway Item',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Self-contained takeaway row — timestamp chip, body text, and optional inline tag all in one shadow DOM so hover cascades correctly.' } },
  },
};

const list = (items) => html`
  <div style="display:flex;flex-direction:column;gap:2px;width:480px">
    ${items.map(({ ts, point, label }) => html`
      <wla-takeaway
        .ts=${ts ?? null}
        point=${point}
        label=${label ?? ''}
      ></wla-takeaway>
    `)}
  </div>
`;

export const Simple = {
  render: () => list([{
    ts: 83,
    point: 'The library uses a virtual DOM diffing algorithm to minimise re-renders.',
  }]),
};

export const WorthWatching = {
  render: () => list([{
    ts: 312,
    label: 'worth watching',
    point: 'The author shows a subtle gotcha with closures inside loops that trips up most developers — watch the live demo.',
  }]),
};

export const NoTimestamp = {
  render: () => list([{
    point: 'This video covers fundamentals only — no advanced patterns discussed.',
  }]),
};

const ITEMS = [
  { ts: 12,   point: 'Shadow DOM encapsulates styles so they never leak out to the page.' },
  { ts: 210,  label: 'worth watching', point: "The speaker's live refactor from class components to hooks is the clearest explanation I've seen — pay close attention." },
  { ts: 445,  point: 'CSS custom properties pierce the shadow boundary, making design tokens the right tool for theming.' },
  { ts: 918,  label: 'worth watching', point: 'The performance comparison at the end challenges the "always use a framework" assumption with real numbers.' },
  {           point: "Lit's render scheduler batches updates into a single microtask." },
];

export const List = {
  render: () => list(ITEMS),
};
