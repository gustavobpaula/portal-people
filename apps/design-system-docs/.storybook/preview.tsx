import type { Preview } from '@storybook/react-vite';
import '@portal/design-tokens';

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    layout: 'padded',
    viewport: { viewports: { mobile: { name: 'Mobile 320px', styles: { width: '320px', height: '640px' } } } },
  },
  decorators: [(Story) => <div data-theme="light"><Story /></div>],
};

export default preview;
