import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import registry from './assets/journey-registry.json';
import {
  Alert,
  AppHeader,
  Button,
  EmptyState,
  Spinner,
  Surface,
  Text,
  type NavigationItem
} from '@portal/design-system-web';
import type { JourneyManifest, PlatformCapabilities } from '@portal/platform-contracts';
import {
  createWebCapabilities,
  loadFederatedJourney,
  resolveJourneyRegistry,
  type JourneyLoadResult
} from '@portal/platform-runtime';
import styles from './styles.module.scss';

type FederatedManifest = Extract<JourneyManifest, { strategy: 'federated-module' }>;
type JourneyLoader = typeof loadFederatedJourney;

export interface AppProps {
  registryData?: unknown;
  loadJourney?: JourneyLoader;
  createCapabilities?: typeof createWebCapabilities;
}

function getJourneyLabel(manifest: JourneyManifest) {
  return manifest.displayName ?? manifest.id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

function isCurrentRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function shouldHandleNavigation(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function trackJourney(platform: PlatformCapabilities, name: string, manifest: FederatedManifest, extra: Record<string, string | number | boolean> = {}) {
  platform.telemetry.track({
    name,
    properties: {
      domain: manifest.observability.domain,
      version: manifest.version,
      route: manifest.route,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra
    }
  });
}

class JourneyErrorBoundary extends Component<{
  onError: () => void;
  onRetry: () => void;
  onReturn: () => void;
  children: ReactNode;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return <JourneyFallback reason="render-error" onRetry={this.props.onRetry} onReturn={this.props.onReturn} />;
    return this.props.children;
  }
}

function JourneyFallback({ reason, onRetry, onReturn }: { reason: Exclude<JourneyLoadResult, { status: 'ready' }>['reason'] | 'render-error'; onRetry: () => void; onReturn: () => void }) {
  const message = {
    'invalid-manifest': 'A configuração da jornada não é válida.',
    'incompatible-contract': 'A jornada requer uma versão incompatível da plataforma.',
    'remote-timeout': 'A jornada demorou mais que o esperado para responder.',
    'remote-unavailable': 'A jornada está temporariamente indisponível.',
    'render-error': 'A jornada encontrou um erro ao ser exibida.'
  }[reason];
  return (
    <Alert tone="error" title="Jornada indisponível">
      <Text>{message}</Text>
      <div className={styles.actions}>
        <Button type="button" onClick={onRetry}>Tentar novamente</Button>
        <Button type="button" variant="secondary" onClick={onReturn}>Voltar ao portal</Button>
      </div>
    </Alert>
  );
}

function JourneySlot({ manifest, platform, loadJourney }: { manifest: FederatedManifest; platform: PlatformCapabilities; loadJourney: JourneyLoader }) {
  const navigate = useNavigate();
  const [result, setResult] = useState<JourneyLoadResult>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    trackJourney(platform, attempt ? 'portal.journey.load.retried' : 'portal.journey.load.started', manifest, attempt ? { attempt } : {});
    void loadJourney(manifest).then((nextResult) => {
      if (!active) return;
      setResult(nextResult);
      if (nextResult.status === 'ready') trackJourney(platform, 'portal.journey.load.succeeded', manifest);
      else trackJourney(platform, 'portal.journey.load.failed', manifest, { reason: nextResult.reason });
    });
    return () => { active = false; };
  }, [attempt, loadJourney, manifest, platform]);

  const retry = () => {
    setResult(undefined);
    setAttempt((value) => value + 1);
  };
  const returnToPortal = () => navigate('/');

  if (!result) return <div className={styles.loading}><Spinner size="lg" label={`Carregando ${getJourneyLabel(manifest)}`} /></div>;
  if (result.status === 'fallback') return <JourneyFallback reason={result.reason} onRetry={retry} onReturn={returnToPortal} />;

  const Journey = result.module.default;
  return (
    <JourneyErrorBoundary
      key={attempt}
      onError={() => trackJourney(platform, 'portal.journey.load.failed', manifest, { reason: 'render-error' })}
      onRetry={retry}
      onReturn={returnToPortal}
    >
      <Journey platform={platform} />
    </JourneyErrorBoundary>
  );
}

function ShellContent({ registryData = registry, loadJourney = loadFederatedJourney, createCapabilities = createWebCapabilities }: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const resolution = useMemo(() => resolveJourneyRegistry(registryData), [registryData]);
  const journeys = useMemo(
    () => resolution.journeys.filter((manifest): manifest is FederatedManifest => manifest.strategy === 'federated-module'),
    [resolution.journeys]
  );
  const [platform] = useState(() => createCapabilities({
    navigate: (path) => navigate(path),
    telemetry: { track: (event) => console.info('portal-event', event.name, event.properties) }
  }));

  useEffect(() => {
    platform.telemetry.track({
      name: 'portal.registry.resolved',
      properties: {
        validCount: journeys.length,
        invalidCount: resolution.rejected.length,
        platform: platform.context.platform,
        correlationId: platform.context.correlationId
      }
    });
  }, [journeys.length, platform, resolution.rejected.length]);

  const navigationItems: NavigationItem[] = [
    { id: 'portal', label: 'Portal', href: '/', current: location.pathname === '/' },
    ...journeys.map((manifest) => ({ id: manifest.id, label: getJourneyLabel(manifest), href: manifest.route, current: isCurrentRoute(location.pathname, manifest.route) }))
  ];
  const interceptNavigation = (event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; preventDefault: () => void }, href: string) => {
    if (!shouldHandleNavigation(event)) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    <div className={styles.shell}>
      <AppHeader
        navigationItems={navigationItems}
        onNavigate={(item, event) => interceptNavigation(event, item.href)}
        onHomeNavigate={(event) => interceptNavigation(event, '/')}
      />
      <main className={styles.main}>
        {resolution.rejected.length ? <Alert tone="warning" title="Algumas jornadas não puderam ser registradas"><Text>As jornadas disponíveis continuam acessíveis.</Text></Alert> : null}
        <Routes>
          <Route path="/" element={<Surface as="section" padding="lg" elevation={1}><Text as="h1" variant="display">Portal Pessoas</Text><Text tone="muted">Selecione uma jornada na navegação para continuar.</Text></Surface>} />
          {journeys.map((manifest) => <Route key={manifest.id} path={`${manifest.route}/*`} element={<JourneySlot manifest={manifest} platform={platform} loadJourney={loadJourney} />} />)}
          <Route path="*" element={<EmptyState title="Página não encontrada" description="Escolha uma jornada disponível para continuar." action={<Button type="button" onClick={() => navigate('/')}>Voltar ao portal</Button>} />} />
        </Routes>
      </main>
    </div>
  );
}

/** Composes routes from the local registry without importing domain implementations. */
export function App(props: AppProps) {
  return <ShellContent {...props} />;
}
