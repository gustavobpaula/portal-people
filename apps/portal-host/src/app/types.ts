import type {
  JourneyManifest,
  PlatformCapabilities,
} from "@portal/platform-contracts";
import type { loadFederatedJourney } from "@portal/platform-runtime";
import type {
  NativeBridge,
  PlatformAdapter,
  PlatformAdapterOptions,
} from "@portal/platform-mobile-bridge";
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
export type NativeManifest = Extract<
  JourneyManifest,
  { strategy: "native-route" }
>;
export type JourneyLoader = typeof loadFederatedJourney;
export type RegistrySource =
  | "bootstrap"
  | "injected"
  | "remote"
  | "safe-fallback";

export interface AppProps {
  registryData?: unknown;
  loadJourney?: JourneyLoader;
  createCapabilities?: (options: {
    navigate: (path: string) => void;
    telemetry: PlatformCapabilities["telemetry"];
    context?: PlatformCapabilities["context"];
  }) => PlatformCapabilities;
  createPlatformAdapter?: (options: PlatformAdapterOptions) => PlatformAdapter;
  platformMode?: "web" | "webview";
  nativeBridge?: NativeBridge;
  portalBffClient?: PortalBffClient;
  journeyRegistryClient?: JourneyRegistryClient;
  externalOrigins?: readonly string[];
  checkExternalAvailability?: (
    destination: string,
    platform?: PlatformCapabilities,
  ) => Promise<boolean>;
  navigateExternal?: (destination: string) => void;
}
