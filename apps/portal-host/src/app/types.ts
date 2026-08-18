import type { JourneyManifest, PlatformCapabilities } from "@portal/platform-contracts";
import type { loadFederatedJourney } from "@portal/platform-runtime";
import type { JourneyRegistryClient } from "../services/journey-registry/journey-registry";
import type { PortalBffClient } from "../services/portal-bff/portal-bff";

export type FederatedManifest = Extract<
  JourneyManifest,
  { strategy: "federated-module" }
>;
export type ExternalManifest = Extract<
  JourneyManifest,
  { strategy: "external-web" }
>;
export type JourneyLoader = typeof loadFederatedJourney;

export interface AppProps {
  registryData?: unknown;
  loadJourney?: JourneyLoader;
  createCapabilities?: (options: {
    navigate: (path: string) => void;
    telemetry: PlatformCapabilities["telemetry"];
  }) => PlatformCapabilities;
  portalBffClient?: PortalBffClient;
  journeyRegistryClient?: JourneyRegistryClient;
  externalOrigins?: readonly string[];
  checkExternalAvailability?: (destination: string) => Promise<boolean>;
  navigateExternal?: (destination: string) => void;
}
