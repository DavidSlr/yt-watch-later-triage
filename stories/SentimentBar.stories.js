import { html } from 'lit';
import '../components/wla-sentiment-bar.js';

export default {
  title: 'Components/SentimentBar',
  component: 'wla-sentiment-bar',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    positive: { control: { type: 'range', min: 0, max: 100 } },
    neutral:  { control: { type: 'range', min: 0, max: 100 } },
    negative: { control: { type: 'range', min: 0, max: 100 } },
  },
};

export const Positive = {
  args: { positive: 72, neutral: 20, negative: 8 },
  render: ({ positive, neutral, negative }) => html`
    <div style="width:320px">
      <wla-sentiment-bar positive=${positive} neutral=${neutral} negative=${negative}></wla-sentiment-bar>
    </div>
  `,
};

export const Mixed = {
  args: { positive: 40, neutral: 35, negative: 25 },
  render: ({ positive, neutral, negative }) => html`
    <div style="width:320px">
      <wla-sentiment-bar positive=${positive} neutral=${neutral} negative=${negative}></wla-sentiment-bar>
    </div>
  `,
};

export const Negative = {
  args: { positive: 15, neutral: 25, negative: 60 },
  render: ({ positive, neutral, negative }) => html`
    <div style="width:320px">
      <wla-sentiment-bar positive=${positive} neutral=${neutral} negative=${negative}></wla-sentiment-bar>
    </div>
  `,
};
