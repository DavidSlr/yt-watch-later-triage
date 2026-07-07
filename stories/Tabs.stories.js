import { html } from 'lit';
import '../components/wla-tabs.js';

export default {
  title: 'Components/Tabs',
  component: 'wla-tabs',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export const Default = {
  render: () => html`
    <div style="width:480px;height:300px;border:1px solid var(--color-border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column">
      <wla-tabs .tabs=${[{ id: 'transcript', label: 'Transcript' }, { id: 'prompt', label: 'AI Prompt' }]} active="transcript">
        <div slot="transcript">
          <pre style="font-family:ui-monospace,'Fira Code',monospace;font-size:0.75rem;line-height:1.6;color:var(--color-text);white-space:pre-wrap;margin:0">[0:00] Welcome to this tutorial on web components.
[0:10] Today we'll cover custom elements, shadow DOM,
[0:20] and how to build a design system with Lit.
[0:30] Let's start with the basics...</pre>
        </div>
        <div slot="prompt">
          <pre style="font-family:ui-monospace,'Fira Code',monospace;font-size:0.75rem;line-height:1.6;color:var(--color-text);white-space:pre-wrap;margin:0">You are a video analysis assistant.

Summarize the following transcript in 2-3 sentences,
then extract 3-5 key takeaways as bullet points.

TRANSCRIPT:
Welcome to this tutorial on web components...</pre>
        </div>
      </wla-tabs>
    </div>
  `,
};

export const SecondTabActive = {
  render: () => html`
    <div style="width:480px;height:300px;border:1px solid var(--color-border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column">
      <wla-tabs .tabs=${[{ id: 'transcript', label: 'Transcript' }, { id: 'prompt', label: 'AI Prompt' }]} active="prompt">
        <div slot="transcript">
          <pre style="font-family:ui-monospace,'Fira Code',monospace;font-size:0.75rem;line-height:1.6;color:var(--color-text);white-space:pre-wrap;margin:0">[0:00] Transcript content here...</pre>
        </div>
        <div slot="prompt">
          <pre style="font-family:ui-monospace,'Fira Code',monospace;font-size:0.75rem;line-height:1.6;color:var(--color-text);white-space:pre-wrap;margin:0">You are a video analysis assistant.

Summarize the following transcript...</pre>
        </div>
      </wla-tabs>
    </div>
  `,
};
