import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { FederatedJourneyModule, PlatformCapabilities } from '@portal/platform-contracts';
import type { JourneyLoadResult } from '@portal/platform-runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const manifest = {
  id: 'neutral-journey', displayName: 'Fundação da plataforma', route: '/foundation', strategy: 'federated-module', version: '1.0.0', platformCompatibility: '^1.0.0',
  owner: { squad: 'platform', contact: 'platform@example.test' }, observability: { domain: 'foundation', eventNamespace: 'foundation' },
  rollout: { audience: 'all', percentage: 100 }, remote: { name: 'neutral-remote', entry: 'http://localhost:4201/mf-manifest.json', exposedModule: './Journey' }
} as const;

const track = vi.fn();
const capabilities: PlatformCapabilities = {
  navigate: vi.fn(),
  context: { correlationId: 'correlation-stable', locale: 'pt-BR', platform: 'web' },
  telemetry: { track },
  flags: {},
  notifications: { show: () => undefined },
  device: { isAvailable: () => false }
};

function renderShell(options: {
  registryData?: unknown;
  initialPath?: string;
  loadJourney?: (value: unknown) => Promise<JourneyLoadResult>;
} = {}) {
  const createCapabilities = vi.fn(() => capabilities);
  return {
    createCapabilities,
    ...render(
      <MemoryRouter initialEntries={[options.initialPath ?? '/foundation']}>
        <App
          registryData={options.registryData ?? [manifest]}
          loadJourney={(options.loadJourney ?? (async () => ({ status: 'ready', manifest, module: { default: () => <p>Jornada carregada</p> } }))) as typeof import('@portal/platform-runtime').loadFederatedJourney}
          createCapabilities={createCapabilities as typeof import('@portal/platform-runtime').createWebCapabilities}
        />
      </MemoryRouter>
    )
  };
}

describe('App', () => {
  afterEach(cleanup);

  beforeEach(() => {
    track.mockReset();
    vi.mocked(capabilities.navigate).mockReset();
  });

  it('renders the shell header actions without listing journeys and keeps capabilities stable', async () => {
    const received = vi.fn();
    const remote: FederatedJourneyModule = { default: ({ platform }) => { received(platform); return <p>Correlação: {platform.context.correlationId}</p>; } };
    const loader = vi.fn(async (): Promise<JourneyLoadResult> => ({ status: 'ready', manifest, module: remote }));
    const view = renderShell({ loadJourney: loader });

    await screen.findByText('Correlação: correlation-stable');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notificações' })).toHaveAttribute('href', '/notificacoes');
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument();
    expect(view.createCapabilities).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenLastCalledWith(capabilities);
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: 'portal.journey.load.succeeded' }));
  });

  it('isolates invalid registry entries while preserving the valid journey', async () => {
    renderShell({ registryData: [manifest, {}] });
    await screen.findByText('Jornada carregada');
    expect(screen.getByRole('alert')).toHaveTextContent('Algumas jornadas não puderam ser registradas');
    expect(screen.queryByRole('link', { name: /Fundação da plataforma/ })).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: 'portal.registry.resolved', properties: expect.objectContaining({ invalidCount: 1 }) }));
  });

  it('shows a fallback and retries only the selected journey', async () => {
    const loader = vi.fn()
      .mockResolvedValueOnce({ status: 'fallback', reason: 'remote-timeout' })
      .mockResolvedValueOnce({ status: 'ready', manifest, module: { default: () => <p>Recuperada</p> } });
    renderShell({ loadJourney: loader as (value: unknown) => Promise<JourneyLoadResult> });

    await screen.findByText('A jornada demorou mais que o esperado para responder.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByText('Recuperada');
    expect(loader).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: 'portal.journey.load.retried' }));
  });

  it('returns safely to the landing page after a failure', async () => {
    renderShell({ loadJourney: async () => ({ status: 'fallback', reason: 'incompatible-contract' }) });
    await screen.findByText('A jornada requer uma versão incompatível da plataforma.');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao portal' }));
    expect(await screen.findByRole('heading', { name: 'Portal Pessoas' })).toBeInTheDocument();
  });

  it('contains render errors without unmounting the shell', async () => {
    const ThrowingJourney = () => { throw new Error('private remote detail'); };
    renderShell({ loadJourney: async () => ({ status: 'ready', manifest, module: { default: ThrowingJourney } }) });
    await screen.findByText('A jornada encontrou um erro ao ser exibida.');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: 'portal.journey.load.failed', properties: expect.objectContaining({ reason: 'render-error' }) }));
  });
});
