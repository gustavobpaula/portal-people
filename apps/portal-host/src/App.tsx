import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, Routes, Route } from "react-router-dom";
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
  prepareExternalJourney,
  resolveJourneyRegistry,
  type JourneyLoadResult,
} from "@portal/platform-runtime";
import styles from "./styles.module.scss";
import { PortalHome, PortalNotifications } from "./portal-experiences";
import { portalBffClient, type PortalBffClient } from "./portal-bff";
import { isExternalJourneyAvailable } from "./external-availability";
import {
  journeyRegistryClient,
  type JourneyRegistryClient,
} from "./journey-registry";
import registry from "./assets/journey-registry.json";

type FederatedManifest = Extract<
  JourneyManifest,
  { strategy: "federated-module" }
>;
type ExternalManifest = Extract<JourneyManifest, { strategy: "external-web" }>;
type JourneyLoader = typeof loadFederatedJourney;
type FallbackReason =
  | Exclude<JourneyLoadResult, { status: "ready" }>["reason"]
  | "render-error"
  | "external-origin-not-allowed"
  | "external-unavailable"
  | "invalid-return-route";

const EXTERNAL_WEB_ALLOWED_ORIGINS = ["http://localhost:4500"];

export interface AppProps {
  registryData?: unknown;
  loadJourney?: JourneyLoader;
  createCapabilities?: typeof createWebCapabilities;
  portalBffClient?: PortalBffClient;
  journeyRegistryClient?: JourneyRegistryClient;
  externalOrigins?: readonly string[];
  checkExternalAvailability?: (destination: string) => Promise<boolean>;
  navigateExternal?: (destination: string) => void;
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

/** Emits a journey lifecycle event with only safe manifest and platform context. */
function trackJourney(
  platform: PlatformCapabilities,
  name: string,
  manifest: JourneyManifest,
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

function trackRegistry(
  platform: PlatformCapabilities,
  name: string,
  route: string,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    name,
    properties: {
      route,
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
  reason: FallbackReason;
  onRetry: () => void;
  onReturn: () => void;
}) {
  const message: Record<FallbackReason, string> = {
    "invalid-manifest": "A configuração da jornada não é válida.",
    "incompatible-contract":
      "A jornada requer uma versão incompatível da plataforma.",
    "remote-timeout": "A jornada demorou mais que o esperado para responder.",
    "remote-unavailable": "A jornada está temporariamente indisponível.",
    "render-error": "A jornada encontrou um erro ao ser exibida.",
    "external-origin-not-allowed":
      "O destino externo não é permitido pela plataforma.",
    "external-unavailable":
      "A jornada está temporariamente indisponível.",
    "invalid-return-route": "A rota de retorno da jornada não é válida.",
  };
  return (
    <Alert tone="error" title="Jornada indisponível">
      <Text>{message[reason]}</Text>
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

function ExternalJourneySlot({
  manifest,
  platform,
  allowedOrigins,
  checkExternalAvailability,
  navigateExternal,
}: {
  manifest: ExternalManifest;
  platform: PlatformCapabilities;
  allowedOrigins: readonly string[];
  checkExternalAvailability: (destination: string) => Promise<boolean>;
  navigateExternal: (destination: string) => void;
}) {
  const navigate = useNavigate();
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const prepared = useMemo(
    () => prepareExternalJourney(manifest, allowedOrigins, window.location.origin),
    [allowedOrigins, manifest],
  );

  useEffect(() => {
    if (prepared.status === "fallback") {
      trackJourney(platform, "portal.journey.load.failed", manifest, {
        reason: prepared.reason,
      });
    }
  }, [manifest, platform, prepared]);

  useEffect(() => {
    if (prepared.status !== "ready" || started.current) return;
    let active = true;
    setIsUnavailable(false);
    void checkExternalAvailability(prepared.destination).then((available) => {
      if (!active) return;
      if (!available) {
        setIsUnavailable(true);
        trackJourney(platform, "portal.journey.load.failed", manifest, {
          reason: "external-unavailable",
        });
        return;
      }
      started.current = true;
      trackJourney(platform, "portal.journey.external.transitioned", manifest);
      navigateExternal(prepared.destination);
    });
    return () => {
      active = false;
    };
  }, [attempt, checkExternalAvailability, manifest, navigateExternal, platform, prepared]);

  if (prepared.status === "fallback")
    return (
      <JourneyFallback
        reason={prepared.reason}
        onRetry={() => {
          trackJourney(platform, "portal.journey.load.retried", manifest);
          window.location.reload();
        }}
        onReturn={() => navigate("/")}
      />
    );
  if (isUnavailable)
    return (
      <JourneyFallback
        reason="external-unavailable"
        onRetry={() => {
          trackJourney(platform, "portal.journey.load.retried", manifest, {
            reason: "external-unavailable",
          });
          started.current = false;
          setAttempt((current) => current + 1);
        }}
        onReturn={() => navigate("/")}
      />
    );
  return (
    <div className={styles.loading}>
      <Spinner size="lg" label={`Abrindo ${getJourneyLabel(manifest)}`} />
    </div>
  );
}

function RejectedJourneySlot({
  route,
  platform,
  onRetry,
}: {
  route: string;
  platform: PlatformCapabilities;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    trackRegistry(platform, "portal.journey.load.failed", route, {
      reason: "invalid-manifest",
    });
  }, [platform, route]);
  return (
    <JourneyFallback
      reason="invalid-manifest"
      onRetry={onRetry}
      onReturn={() => navigate("/")}
    />
  );
}

function ExternalReturn({
  journeys,
  platform,
}: {
  journeys: JourneyManifest[];
  platform: PlatformCapabilities;
}) {
  const navigate = useNavigate();
  const { journeyId } = useParams();
  const expectedReturnRoute = journeyId ? `/retorno/${journeyId}` : undefined;
  const manifest = journeys.find(
    (journey): journey is ExternalManifest =>
      journey.id === journeyId &&
      journey.strategy === "external-web" &&
      journey.returnRoute === expectedReturnRoute,
  );
  useEffect(() => {
    if (manifest) {
      trackJourney(platform, "portal.journey.external.returned", manifest);
      navigate("/", { replace: true });
      return;
    }
    trackRegistry(
      platform,
      "portal.journey.load.failed",
      expectedReturnRoute ?? "/retorno",
      { reason: "invalid-return-route" },
    );
  }, [expectedReturnRoute, manifest, navigate, platform]);

  if (!manifest)
    return (
      <JourneyFallback
        reason="invalid-return-route"
        onRetry={() => {
          trackRegistry(
            platform,
            "portal.journey.load.retried",
            expectedReturnRoute ?? "/retorno",
            { reason: "invalid-return-route" },
          );
          window.location.reload();
        }}
        onReturn={() => navigate("/")}
      />
    );
  return <Spinner label="Retornando ao Portal Pessoas" />;
}

/** Composes transversal routes and registered journeys without importing domain code. */
function ShellContent({
  registryData,
  loadJourney = loadFederatedJourney,
  createCapabilities = createWebCapabilities,
  portalBffClient: bffClient = portalBffClient,
  externalOrigins = EXTERNAL_WEB_ALLOWED_ORIGINS,
  checkExternalAvailability = isExternalJourneyAvailable,
  navigateExternal = (destination) => window.location.assign(destination),
}: AppProps) {
  const navigate = useNavigate();
  const [platform] = useState(() =>
    createCapabilities({
      navigate: (path) => navigate(path),
      telemetry: {
        track: (event) =>
          console.info("portal-event", event.name, event.properties),
      },
    }),
  );
  const resolution = useMemo(
    () => resolveJourneyRegistry(registryData),
    [registryData],
  );
  const journeys = resolution.journeys.filter(
    (manifest): manifest is FederatedManifest | ExternalManifest =>
      manifest.strategy === "federated-module" || manifest.strategy === "external-web",
  );
  const rejectedRoutes = resolution.rejected.filter(
    (rejected): rejected is typeof rejected & { route: string } =>
      Boolean(rejected.route),
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
            <Route
              path="/retorno/:journeyId"
              element={<ExternalReturn journeys={journeys} platform={platform} />}
            />
            {journeys.map((manifest) => (
              <Route
                key={manifest.id}
                path={`${manifest.route}/*`}
                element={
                  manifest.strategy === "federated-module" ? (
                    <JourneySlot
                      manifest={manifest}
                      platform={platform}
                      loadJourney={loadJourney}
                    />
                  ) : (
                    <ExternalJourneySlot
                      manifest={manifest}
                      platform={platform}
                      allowedOrigins={externalOrigins}
                      checkExternalAvailability={checkExternalAvailability}
                      navigateExternal={navigateExternal}
                    />
                  )
                }
              />
            ))}
            {rejectedRoutes.map((rejected) => (
              <Route
                key={`rejected-${rejected.index}`}
                path={`${rejected.route}/*`}
                element={
                  <RejectedJourneySlot
                    route={rejected.route}
                    platform={platform}
                    onRetry={() => window.location.reload()}
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
      </main>
    </div>
  );
}

/** Composes routes from the resolved registry without importing domain implementations. */
export function App(props: AppProps) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <JourneyRegistryBoundary {...props} />
    </QueryClientProvider>
  );
}

/** Retrieves the resolved catalog through the Journey Registry boundary. */
function JourneyRegistryBoundary({
  registryData,
  journeyRegistryClient: registryClient = journeyRegistryClient,
  ...props
}: AppProps) {
  const registryQuery = useQuery({
    queryKey: ["journey-registry"],
    queryFn: ({ signal }) => registryClient.getJourneys(signal),
    enabled: registryData === undefined,
    retry: false,
  });
  const isUsingFallback = registryData === undefined && registryQuery.isError;
  const resolvedRegistry = registryData ?? registryQuery.data ?? registry;

  return (
    <>
      {isUsingFallback ? <RegistryUnavailable onRetry={() => void registryQuery.refetch()} /> : null}
      <ShellContent {...props} registryData={resolvedRegistry} />
    </>
  );
}

function RegistryUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.registryFallback} role="alert">
      <Text>Não foi possível atualizar as jornadas. Exibimos o último catálogo seguro.</Text>
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
