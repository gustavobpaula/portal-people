import { Button, EmptyState } from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import type { PlatformAdapter } from "@portal/platform-mobile-bridge";
import type { JourneyRegistryResolution } from "@portal/platform-runtime";
import { Route, Routes, type NavigateFunction } from "react-router-dom";
import type { PortalBffClient } from "../services/portal-bff/portal-bff";
import { ExternalJourneySlot } from "./journeys/ExternalJourneySlot";
import { FederatedJourneySlot } from "./journeys/FederatedJourneySlot";
import { NativeJourneySlot } from "./journeys/NativeJourneySlot";
import {
  ExternalReturn,
  RejectedJourneySlot,
} from "./journeys/RegistryJourneySlots";
import { PortalHome, PortalNotifications } from "./portal-experiences";
import type {
  AppProps,
  ExternalManifest,
  FederatedManifest,
  JourneyLoader,
  NativeManifest,
} from "./types";

type Journey = FederatedManifest | ExternalManifest | NativeManifest;
type RejectedRoute = JourneyRegistryResolution["rejected"][number] & {
  route: string;
};

type ShellRoutesProps = {
  journeys: Journey[];
  rejectedRoutes: RejectedRoute[];
  platform: PlatformCapabilities;
  adapter: PlatformAdapter;
  bffClient: PortalBffClient;
  loadJourney: JourneyLoader;
  externalOrigins: readonly string[];
  checkExternalAvailability: NonNullable<AppProps["checkExternalAvailability"]>;
  navigateExternal: NonNullable<AppProps["navigateExternal"]>;
  navigate: NavigateFunction;
  onNavigate: (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => void;
};

type JourneyRouteElementProps = Pick<
  ShellRoutesProps,
  | "platform"
  | "adapter"
  | "loadJourney"
  | "externalOrigins"
  | "checkExternalAvailability"
  | "navigateExternal"
> & {
  manifest: Journey;
};

function JourneyRouteElement({
  manifest,
  platform,
  adapter,
  loadJourney,
  externalOrigins,
  checkExternalAvailability,
  navigateExternal,
}: JourneyRouteElementProps) {
  if (manifest.strategy === "federated-module") {
    return (
      <FederatedJourneySlot
        manifest={manifest}
        platform={platform}
        loadJourney={loadJourney}
      />
    );
  }

  if (manifest.strategy === "external-web") {
    return (
      <ExternalJourneySlot
        manifest={manifest}
        platform={platform}
        allowedOrigins={externalOrigins}
        checkExternalAvailability={checkExternalAvailability}
        navigateExternal={navigateExternal}
      />
    );
  }

  return <NativeJourneySlot manifest={manifest} adapter={adapter} />;
}

/** Declares shell-owned routes and maps each journey strategy to its slot. */
export function ShellRoutes({
  journeys,
  rejectedRoutes,
  platform,
  adapter,
  bffClient,
  loadJourney,
  externalOrigins,
  checkExternalAvailability,
  navigateExternal,
  navigate,
  onNavigate,
}: ShellRoutesProps) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PortalHome
            client={bffClient}
            platform={platform}
            onNavigate={onNavigate}
          />
        }
      />
      <Route
        path="/notificacoes"
        element={<PortalNotifications client={bffClient} platform={platform} />}
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
            <JourneyRouteElement
              manifest={manifest}
              platform={platform}
              adapter={adapter}
              loadJourney={loadJourney}
              externalOrigins={externalOrigins}
              checkExternalAvailability={checkExternalAvailability}
              navigateExternal={navigateExternal}
            />
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
  );
}
