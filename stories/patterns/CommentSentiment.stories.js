import { html } from 'lit';
import '../../components/wla-sentiment-bar.js';

export default {
  title: 'Patterns/Comment Sentiment',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'Composes [`wla-sentiment-bar`](?path=/story/components-sentimentbar--positive) for the stacked positive/neutral/negative bar.' } },
  },
};

// ── Theme item ────────────────────────────────────────────────────────────────

const themeItem = ({ tone, theme, quote }) => html`
  <div style="
    font-size: var(--font-size-base, 0.875rem);
    line-height: var(--line-height-base, 1.45);
    color: var(--color-text-muted, #aaa);
  ">
    <span style="
      font-weight: var(--font-weight-bold, 700);
      margin-right: 6px;
      color: ${tone === 'positive' ? '#4ade80' : '#f87171'};
    ">${tone === 'positive' ? '+' : '−'}</span>${theme}
    ${quote ? html`
      <span style="
        display: block;
        margin: 4px 0 0 14px;
        font-style: italic;
        color: #888;
        font-size: var(--font-size-sm, 0.75rem);
        border-left: 2px solid var(--color-border, #2e2e2e);
        padding-left: 8px;
      ">"${quote}"</span>
    ` : ''}
  </div>
`;

// ── Full block ────────────────────────────────────────────────────────────────

const block = ({ positive, neutral, negative, themes }) => html`
  <div style="display:flex;flex-direction:column;gap:0;width:360px">
    <wla-sentiment-bar
      positive=${positive}
      neutral=${neutral}
      negative=${negative}
      style="margin-bottom:16px"
    ></wla-sentiment-bar>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${themes.map(themeItem)}
    </div>
  </div>
`;

// ── Data sets ─────────────────────────────────────────────────────────────────

const MOSTLY_POSITIVE = {
  positive: 72, neutral: 18, negative: 10,
  themes: [
    { tone: 'positive', theme: 'Viewers praised the clear pacing and real-world examples throughout.' },
    { tone: 'positive', theme: 'The live coding demo was highlighted as especially useful.', quote: 'Finally someone who explains it without skipping steps!' },
    { tone: 'negative', theme: 'A few comments noted the audio dips in the second half.', quote: 'Hard to hear around the 18-minute mark' },
  ],
};

const MIXED = {
  positive: 45, neutral: 30, negative: 25,
  themes: [
    { tone: 'positive', theme: 'Strong appreciation for the depth of the topic coverage.' },
    { tone: 'positive', theme: 'Many viewers bookmarked it for repeated reference.', quote: 'This is going straight into my saved videos' },
    { tone: 'negative', theme: 'Commenters divided on the choice of framework — some found it dated.' },
    { tone: 'negative', theme: 'The video length was criticized as too long given the content density.', quote: 'Could have been 10 minutes shorter' },
  ],
};

const MOSTLY_NEGATIVE = {
  positive: 12, neutral: 20, negative: 68,
  themes: [
    { tone: 'negative', theme: 'Significant criticism of the misleading title versus actual content.', quote: 'Clickbait — nothing in the title is covered' },
    { tone: 'negative', theme: 'Many viewers reported outdated code that no longer works.' },
    { tone: 'positive', theme: 'A small group found the introductory section genuinely helpful.' },
  ],
};

// ── Stories ───────────────────────────────────────────────────────────────────

export const PositiveTheme = {
  name: 'Theme item — positive',
  render: () => html`
    <div style="width:360px">
      ${themeItem({ tone: 'positive', theme: 'Viewers praised the clear pacing and real-world examples throughout.' })}
    </div>
  `,
};

export const NegativeTheme = {
  name: 'Theme item — negative',
  render: () => html`
    <div style="width:360px">
      ${themeItem({ tone: 'negative', theme: 'A few comments noted the audio dips in the second half.', quote: 'Hard to hear around the 18-minute mark' })}
    </div>
  `,
};

export const MostlyPositive = {
  name: 'Mostly positive',
  render: () => block(MOSTLY_POSITIVE),
};

export const Mixed = {
  render: () => block(MIXED),
};

export const MostlyNegative = {
  name: 'Mostly negative',
  render: () => block(MOSTLY_NEGATIVE),
};

export const NoComments = {
  name: 'No comments available',
  render: () => html`
    <p style="
      font-size: var(--font-size-base, 0.875rem);
      color: var(--color-text-disabled, #555);
      font-style: italic;
      margin: 0;
    ">No comments available for this video.</p>
  `,
};
