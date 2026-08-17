import { render, screen } from '@testing-library/react';
import type { PlatformCapabilities } from '@portal/platform-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  createWebCapabilities: vi.fn(),
  loadFederatedJourney: vi.fn()
}));

vi.mock('@portal/platform-runtime', () => runtime);

import { App } from './App';

const capabilities: PlatformCapabilities = {
  navigate: () => undefined,
  context: { correlationId: 'correlation-stable', locale: 'pt-BR', platform: 'web' },
  telemetry: { track: () => undefined },
  flags: {},
  notifications: { show: () => undefined },
  device: { isAvailable: () => false }
};

describe('App', () => {
  beforeEach(() => {
    runtime.createWebCapabilities.mockReset().mockReturnValue(capabilities);
    runtime.loadFederatedJourney.mockReset();
  });

  it('keeps platform capabilities stable after the remote load re-renders the host', async () => {
    const receivedCapabilities = vi.fn();
    function Remote({ platform }: { platform: PlatformCapabilities }) {
      receivedCapabilities(platform);
      return <p>Correlação: {platform.context.correlationId}</p>;
    }

    runtime.loadFederatedJourney.mockResolvedValue({
      status: 'ready',
      module: { default: Remote }
    });

    const view = render(<App />);

    await screen.findByText('Correlação: correlation-stable');
    expect(runtime.createWebCapabilities).toHaveBeenCalledTimes(1);
    expect(receivedCapabilities).toHaveBeenLastCalledWith(capabilities);

    view.rerender(<App />);

    expect(runtime.createWebCapabilities).toHaveBeenCalledTimes(1);
    expect(receivedCapabilities).toHaveBeenLastCalledWith(capabilities);
  });
});
