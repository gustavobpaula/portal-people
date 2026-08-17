import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import * as stories from './components.stories';

const storyEntries = Object.entries(stories).filter(([name, value]) => name !== 'default' && typeof value === 'object' && value !== null && 'render' in value);

describe('documented component stories', () => {
  afterEach(cleanup);

  for (const [name, story] of storyEntries) {
    it(`renders ${name} in Chromium`, () => {
      const renderStory = (story as { render: () => ReactNode }).render;
      const StoryRender = renderStory;
      const { container } = render(<StoryRender />);
      expect(container.textContent).not.toBe('');
    });
  }
});
