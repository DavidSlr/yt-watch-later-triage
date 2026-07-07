import '../tokens/tokens.css';
import './global.css';

/** @type { import('@storybook/web-components').Preview } */
const preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark',    value: '#0f0f0f' },
        { name: 'surface', value: '#1a1a1a' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
