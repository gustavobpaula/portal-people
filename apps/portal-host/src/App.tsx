import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNavigate, Routes, Route } from "react-router-dom";
import registry from "./assets/journey-registry.json";
import {
  Alert,
  AppHeader,
  Button,
  EmptyState,
  Icon,
  Spinner,
  Text,
} from "@portal/design-system-web";
import type {
  JourneyManifest,
  PlatformCapabilities,
} from "@portal/platform-contracts";
import {
  createWebCapabilities,
  loadFederatedJourney,
  resolveJourneyRegistry,
  type JourneyLoadResult,
} from "@portal/platform-runtime";
import styles from "./styles.module.scss";
import { PortalHome, PortalNotifications } from "./portal-experiences";
import { portalBffClient, type PortalBffClient } from "./portal-bff";

type FederatedManifest = Extract<
  JourneyManifest,
  { strategy: "federated-module" }
>;
type JourneyLoader = typeof loadFederatedJourney;

export interface AppProps {
  registryData?: unknown;
  loadJourney?: JourneyLoader;
  createCapabilities?: typeof createWebCapabilities;
  portalBffClient?: PortalBffClient;
}

function getJourneyLabel(manifest: JourneyManifest) {
  return (
    manifest.displayName ??
    manifest.id
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" ")
  );
}

/** Limits SPA interception to unmodified primary-pointer navigation. */
function shouldHandleNavigation(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/** Emits a journey lifecycle event with the manifest's safe observability context. */
function trackJourney(
  platform: PlatformCapabilities,
  name: string,
  manifest: FederatedManifest,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    name,
    properties: {
      domain: manifest.observability.domain,
      version: manifest.version,
      route: manifest.route,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra,
    },
  });
}

class JourneyErrorBoundary extends Component<
  {
    onError: () => void;
    onRetry: () => void;
    onReturn: () => void;
    children: ReactNode;
  },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed)
      return (
        <JourneyFallback
          reason="render-error"
          onRetry={this.props.onRetry}
          onReturn={this.props.onReturn}
        />
      );
    return this.props.children;
  }
}

function JourneyFallback({
  reason,
  onRetry,
  onReturn,
}: {
  reason:
    | Exclude<JourneyLoadResult, { status: "ready" }>["reason"]
    | "render-error";
  onRetry: () => void;
  onReturn: () => void;
}) {
  const message = {
    "invalid-manifest": "A configuração da jornada não é válida.",
    "incompatible-contract":
      "A jornada requer uma versão incompatível da plataforma.",
    "remote-timeout": "A jornada demorou mais que o esperado para responder.",
    "remote-unavailable": "A jornada está temporariamente indisponível.",
    "render-error": "A jornada encontrou um erro ao ser exibida.",
  }[reason];
  return (
    <Alert tone="error" title="Jornada indisponível">
      <Text>{message}</Text>
      <div className={styles.actions}>
        <Button type="button" onClick={onRetry}>
          Tentar novamente
        </Button>
        <Button type="button" variant="secondary" onClick={onReturn}>
          Voltar ao portal
        </Button>
      </div>
    </Alert>
  );
}

function JourneySlot({
  manifest,
  platform,
  loadJourney,
}: {
  manifest: FederatedManifest;
  platform: PlatformCapabilities;
  loadJourney: JourneyLoader;
}) {
  const navigate = useNavigate();
  const [result, setResult] = useState<JourneyLoadResult>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    trackJourney(
      platform,
      attempt ? "portal.journey.load.retried" : "portal.journey.load.started",
      manifest,
      attempt ? { attempt } : {},
    );
    void loadJourney(manifest).then((nextResult) => {
      if (!active) return;
      setResult(nextResult);
      if (nextResult.status === "ready")
        trackJourney(platform, "portal.journey.load.succeeded", manifest);
      else
        trackJourney(platform, "portal.journey.load.failed", manifest, {
          reason: nextResult.reason,
        });
    });
    return () => {
      active = false;
    };
  }, [attempt, loadJourney, manifest, platform]);

  const retry = () => {
    setResult(undefined);
    setAttempt((value) => value + 1);
  };
  const returnToPortal = () => navigate("/");

  if (!result)
    return (
      <div className={styles.loading}>
        <Spinner size="lg" label={`Carregando ${getJourneyLabel(manifest)}`} />
      </div>
    );
  if (result.status === "fallback")
    return (
      <JourneyFallback
        reason={result.reason}
        onRetry={retry}
        onReturn={returnToPortal}
      />
    );

  const Journey = result.module.default;
  return (
    <JourneyErrorBoundary
      key={attempt}
      onError={() =>
        trackJourney(platform, "portal.journey.load.failed", manifest, {
          reason: "render-error",
        })
      }
      onRetry={retry}
      onReturn={returnToPortal}
    >
      <Journey platform={platform} />
    </JourneyErrorBoundary>
  );
}

/** Composes transversal routes and registered remotes without importing domain code. */
function ShellContent({
  registryData = registry,
  loadJourney = loadFederatedJourney,
  createCapabilities = createWebCapabilities,
  portalBffClient: bffClient = portalBffClient,
}: AppProps) {
  const navigate = useNavigate();
  const resolution = useMemo(
    () => resolveJourneyRegistry(registryData),
    [registryData],
  );
  const journeys = useMemo(
    () =>
      resolution.journeys.filter(
        (manifest): manifest is FederatedManifest =>
          manifest.strategy === "federated-module",
      ),
    [resolution.journeys],
  );
  const [platform] = useState(() =>
    createCapabilities({
      navigate: (path) => navigate(path),
      telemetry: {
        track: (event) =>
          console.info("portal-event", event.name, event.properties),
      },
    }),
  );
  const [portalQueryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );

  useEffect(() => {
    platform.telemetry.track({
      name: "portal.registry.resolved",
      properties: {
        validCount: journeys.length,
        invalidCount: resolution.rejected.length,
        platform: platform.context.platform,
        correlationId: platform.context.correlationId,
      },
    });
  }, [journeys.length, platform, resolution.rejected.length]);

  const interceptNavigation = (
    event: {
      button: number;
      metaKey: boolean;
      ctrlKey: boolean;
      shiftKey: boolean;
      altKey: boolean;
      preventDefault: () => void;
    },
    href: string,
  ) => {
    if (!shouldHandleNavigation(event)) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    <div className={styles.shell}>
      <AppHeader
        onHomeNavigate={(event) => interceptNavigation(event, "/")}
        actions={
          <a
            className={styles.headerNotification}
            href="/notificacoes"
            aria-label="Notificações"
            onClick={(event) => interceptNavigation(event, "/notificacoes")}
          >
            <Icon name="bell" />
          </a>
        }
      />
      <main className={styles.main}>
        {resolution.rejected.length ? (
          <Alert
            tone="warning"
            title="Algumas jornadas não puderam ser registradas"
          >
            <Text>As jornadas disponíveis continuam acessíveis.</Text>
          </Alert>
        ) : null}
        <QueryClientProvider client={portalQueryClient}>
          <Routes>
            <Route
              path="/"
              element={
                <PortalHome
                  client={bffClient}
                  platform={platform}
                  onNavigate={interceptNavigation}
                />
              }
            />
            <Route
              path="/notificacoes"
              element={
                <PortalNotifications client={bffClient} platform={platform} />
              }
            />
            {journeys.map((manifest) => (
              <Route
                key={manifest.id}
                path={`${manifest.route}/*`}
                element={
                  <JourneySlot
                    manifest={manifest}
                    platform={platform}
                    loadJourney={loadJourney}
                  />
                }
              />
            ))}
            <Route
              path="*"
              element={
                <EmptyState
                  title="Página não encontrada"
                  description="Escolha uma jornada disponível para continuar."
                  action={
                    <Button type="button" onClick={() => navigate("/")}>
                      Voltar ao portal
                    </Button>
                  }
                />
              }
            />
          </Routes>
        </QueryClientProvider>
      </main>
    </div>
  );
}

/** Composes routes from the local registry without importing domain implementations. */
export function App(props: AppProps) {
  return <ShellContent {...props} />;
}
