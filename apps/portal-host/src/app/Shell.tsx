import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, AppHeader, Icon, Text } from "@portal/design-system-web";
import {
  loadFederatedJourney,
  resolveJourneyRegistry,
} from "@portal/platform-runtime";
import type { PlatformContext } from "@portal/platform-contracts";
import { isExternalJourneyAvailable } from "../services/external-web/external-availability";
import type { JourneyRegistryError } from "../services/journey-registry/journey-registry";
import { portalBffClient } from "../services/portal-bff/portal-bff";
import { usePlatformAdapter } from "./hooks/usePlatformAdapter";
import { useShellObservability } from "./hooks/useShellObservability";
import { ShellRoutes } from "./ShellRoutes";
import styles from "./styles.module.scss";
import type {
  AppProps,
  ExternalManifest,
  FederatedManifest,
  NativeManifest,
  RegistrySource,
} from "./types";

const EXTERNAL_WEB_ALLOWED_ORIGINS = ["http://localhost:4500"];

function shouldHandleNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

type ShellProps = AppProps & {
  registryData: unknown;
  registrySource: RegistrySource;
  registryFailure?: JourneyRegistryError["kind"];
  correlationContext: PlatformContext;
};

/** Composes platform capabilities, navigation and independently delivered journeys. */
export function Shell({
  registryData,
  registrySource,
  registryFailure,
  correlationContext,
  loadJourney = loadFederatedJourney,
  createCapabilities,
  createPlatformAdapter,
  platformMode = "web",
  nativeBridge,
  portalBffClient: bffClient = portalBffClient,
  externalOrigins = EXTERNAL_WEB_ALLOWED_ORIGINS,
  checkExternalAvailability = isExternalJourneyAvailable,
  navigateExternal = (destination) => window.location.assign(destination),
}: ShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const adapter = usePlatformAdapter({
    correlationContext,
    createCapabilities,
    createPlatformAdapter,
    platformMode,
    nativeBridge,
  });
  const platform = adapter.capabilities;
  const resolution = useMemo(
    () => resolveJourneyRegistry(registryData),
    [registryData],
  );
  const journeys = resolution.journeys.filter(
    (
      manifest,
    ): manifest is FederatedManifest | ExternalManifest | NativeManifest =>
      manifest.strategy === "federated-module" ||
      manifest.strategy === "external-web" ||
      manifest.strategy === "native-route",
  );
  const rejectedRoutes = resolution.rejected.filter(
    (rejected): rejected is typeof rejected & { route: string } =>
      Boolean(rejected.route),
  );

  useShellObservability(platform, {
    route: location.pathname,
    registrySource,
    registryFailure,
    validJourneyCount: journeys.length,
    invalidJourneyCount: resolution.rejected.length,
  });

  const interceptNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
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
        <ShellRoutes
          journeys={journeys}
          rejectedRoutes={rejectedRoutes}
          platform={platform}
          adapter={adapter}
          bffClient={bffClient}
          loadJourney={loadJourney}
          externalOrigins={externalOrigins}
          checkExternalAvailability={checkExternalAvailability}
          navigateExternal={navigateExternal}
          navigate={navigate}
          onNavigate={interceptNavigation}
        />
      </main>
    </div>
  );
}
