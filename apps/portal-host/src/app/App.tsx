import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Route, Routes, useNavigate } from "react-router-dom";
import { Alert, AppHeader, Button, EmptyState, Icon, Text } from "@portal/design-system-web";
import { loadFederatedJourney, resolveJourneyRegistry } from "@portal/platform-runtime";
import { createPlatformAdapter as defaultCreatePlatformAdapter } from "@portal/platform-mobile-bridge";
import { isExternalJourneyAvailable } from "../services/external-web/external-availability";
import { journeyRegistryClient } from "../services/journey-registry/journey-registry";
import { portalBffClient } from "../services/portal-bff/portal-bff";
import registry from "../assets/journey-registry.json";
import { PortalHome, PortalNotifications } from "./portal-experiences";
import { ExternalJourneySlot } from "./journeys/ExternalJourneySlot";
import { FederatedJourneySlot } from "./journeys/FederatedJourneySlot";
import { NativeJourneySlot } from "./journeys/NativeJourneySlot";
import { ExternalReturn, RejectedJourneySlot } from "./journeys/RegistryJourneySlots";
import styles from "./styles.module.scss";
import type { AppProps, ExternalManifest, FederatedManifest, NativeManifest } from "./types";

const EXTERNAL_WEB_ALLOWED_ORIGINS = ["http://localhost:4500"];

function shouldHandleNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function ShellContent({ registryData, loadJourney = loadFederatedJourney, createCapabilities, createPlatformAdapter = defaultCreatePlatformAdapter, platformMode = "web", nativeBridge, portalBffClient: bffClient = portalBffClient, externalOrigins = EXTERNAL_WEB_ALLOWED_ORIGINS, checkExternalAvailability = isExternalJourneyAvailable, navigateExternal = (destination) => window.location.assign(destination) }: AppProps & { registryData: unknown }) {
  const navigate = useNavigate();
  const [adapter] = useState(() => createCapabilities
    ? { capabilities: createCapabilities({ navigate: (path) => navigate(path), telemetry: { track: (event) => console.info("portal-event", event.name, event.properties) } }), openNativeRoute: async () => ({ status: "fallback" as const, reason: "native-unavailable" as const }) }
    : createPlatformAdapter({ mode: platformMode, navigate: (path) => navigate(path), telemetry: { track: (event) => console.info("portal-event", event.name, event.properties) }, origin: window.location.origin, allowedOrigins: ["http://localhost:4200"], bridge: nativeBridge }));
  const platform = adapter.capabilities;
  const resolution = useMemo(() => resolveJourneyRegistry(registryData), [registryData]);
  const journeys = resolution.journeys.filter((manifest): manifest is FederatedManifest | ExternalManifest | NativeManifest => manifest.strategy === "federated-module" || manifest.strategy === "external-web" || manifest.strategy === "native-route");
  const rejectedRoutes = resolution.rejected.filter((rejected): rejected is typeof rejected & { route: string } => Boolean(rejected.route));

  useEffect(() => {
    platform.telemetry.track({ name: "portal.registry.resolved", properties: { validCount: journeys.length, invalidCount: resolution.rejected.length, platform: platform.context.platform, correlationId: platform.context.correlationId } });
  }, [journeys.length, platform, resolution.rejected.length]);

  const interceptNavigation = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!shouldHandleNavigation(event)) return;
    event.preventDefault();
    navigate(href);
  };

  return <div className={styles.shell}>
    <AppHeader onHomeNavigate={(event) => interceptNavigation(event, "/")} actions={<a className={styles.headerNotification} href="/notificacoes" aria-label="Notificações" onClick={(event) => interceptNavigation(event, "/notificacoes")}><Icon name="bell" /></a>} />
    <main className={styles.main}>
      {resolution.rejected.length ? <Alert tone="warning" title="Algumas jornadas não puderam ser registradas"><Text>As jornadas disponíveis continuam acessíveis.</Text></Alert> : null}
      <Routes>
        <Route path="/" element={<PortalHome client={bffClient} platform={platform} onNavigate={interceptNavigation} />} />
        <Route path="/notificacoes" element={<PortalNotifications client={bffClient} platform={platform} />} />
        <Route path="/retorno/:journeyId" element={<ExternalReturn journeys={journeys} platform={platform} />} />
        {journeys.map((manifest) => <Route key={manifest.id} path={`${manifest.route}/*`} element={manifest.strategy === "federated-module" ? <FederatedJourneySlot manifest={manifest} platform={platform} loadJourney={loadJourney} /> : manifest.strategy === "external-web" ? <ExternalJourneySlot manifest={manifest} platform={platform} allowedOrigins={externalOrigins} checkExternalAvailability={checkExternalAvailability} navigateExternal={navigateExternal} /> : <NativeJourneySlot manifest={manifest} adapter={adapter} />} />)}
        {rejectedRoutes.map((rejected) => <Route key={`rejected-${rejected.index}`} path={`${rejected.route}/*`} element={<RejectedJourneySlot route={rejected.route} platform={platform} onRetry={() => window.location.reload()} />} />)}
        <Route path="*" element={<EmptyState title="Página não encontrada" description="Escolha uma jornada disponível para continuar." action={<Button type="button" onClick={() => navigate("/")}>Voltar ao portal</Button>} />} />
      </Routes>
    </main>
  </div>;
}

function JourneyRegistryBoundary({ registryData, journeyRegistryClient: registryClient = journeyRegistryClient, ...props }: AppProps) {
  const registryQuery = useQuery({ queryKey: ["journey-registry"], queryFn: ({ signal }) => registryClient.getJourneys(signal), enabled: registryData === undefined, retry: false });
  const usingFallback = registryData === undefined && registryQuery.isError;
  const resolvedRegistry = registryData ?? registryQuery.data ?? registry;
  return <>{usingFallback ? <div className={styles.registryFallback} role="alert"><Text>Não foi possível atualizar as jornadas. Exibimos o último catálogo seguro.</Text><Button type="button" onClick={() => void registryQuery.refetch()}>Tentar novamente</Button></div> : null}<ShellContent {...props} registryData={resolvedRegistry} /></>;
}

/** Composes platform capabilities, registry resolution and independently delivered journeys. */
export function App(props: AppProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><JourneyRegistryBoundary {...props} /></QueryClientProvider>;
}
