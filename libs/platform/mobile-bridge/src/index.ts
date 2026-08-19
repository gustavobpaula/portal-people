import {
  BRIDGE_CONTRACT_VERSION,
  nativeBridgeDescriptorSchema,
  nativeBridgeRequestSchema,
  nativeBridgeResponseSchema,
  type NativeBridgeRequest,
  type NativeJourneyManifest,
  type PlatformCapabilities,
} from "@portal/platform-contracts";
import type { TelemetryExporter } from "@portal/platform-observability";
import {
  createPlatformCapabilities,
  isCompatible,
} from "@portal/platform-runtime";

export type NativeRouteFailureReason =
  | "native-unavailable"
  | "bridge-unavailable"
  | "bridge-incompatible"
  | "capability-unavailable"
  | "origin-not-allowed"
  | "invalid-payload"
  | "bridge-timeout"
  | "bridge-rejected";

export type NativeRouteResult =
  | { status: "opened" }
  | { status: "fallback"; reason: NativeRouteFailureReason };

export type NativeBridge = Readonly<{
  negotiate: () => unknown;
  invoke: (request: NativeBridgeRequest) => Promise<unknown>;
}>;

export type PlatformAdapter = Readonly<{
  capabilities: PlatformCapabilities;
  openNativeRoute: (
    manifest: NativeJourneyManifest,
  ) => Promise<NativeRouteResult>;
}>;

export type PlatformAdapterOptions = Readonly<{
  mode: "web" | "webview";
  navigate: PlatformCapabilities["navigate"];
  telemetry: PlatformCapabilities["telemetry"];
  context?: PlatformCapabilities["context"];
  telemetryExporter?: TelemetryExporter;
  origin: string;
  allowedOrigins: readonly string[];
  bridge?: NativeBridge;
  timeoutMs?: number;
}>;

function timeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error("bridge-timeout")), timeoutMs),
    ),
  ]);
}

/** Creates the shell-only adapter; remotes receive only `capabilities`. */
export function createPlatformAdapter(
  options: PlatformAdapterOptions,
): PlatformAdapter {
  let descriptor: ReturnType<
    typeof nativeBridgeDescriptorSchema.safeParse
  > | null = null;
  let negotiationFailed = false;
  if (options.mode === "webview" && options.bridge) {
    try {
      descriptor = nativeBridgeDescriptorSchema.safeParse(
        options.bridge.negotiate(),
      );
    } catch {
      negotiationFailed = true;
    }
  }
  const nativeNavigationAvailable = Boolean(
    descriptor?.success &&
    isCompatible(descriptor.data.version, BRIDGE_CONTRACT_VERSION) &&
    descriptor.data.capabilities.includes("native-navigation"),
  );
  const capabilities = createPlatformCapabilities({
    navigate: options.navigate,
    telemetry: options.telemetry,
    context: options.context,
    telemetryExporter: options.telemetryExporter,
    platform: options.mode,
    device: {
      isAvailable: (capability) =>
        capability === "native-navigation" && nativeNavigationAvailable,
    },
  });

  return {
    capabilities,
    async openNativeRoute(manifest) {
      if (options.mode === "web")
        return { status: "fallback", reason: "native-unavailable" };
      if (!options.bridge)
        return { status: "fallback", reason: "bridge-unavailable" };
      if (negotiationFailed)
        return { status: "fallback", reason: "bridge-unavailable" };
      if (
        !descriptor?.success ||
        !isCompatible(descriptor.data.version, BRIDGE_CONTRACT_VERSION)
      ) {
        return { status: "fallback", reason: "bridge-incompatible" };
      }
      if (!descriptor.data.capabilities.includes("native-navigation")) {
        return { status: "fallback", reason: "capability-unavailable" };
      }
      if (!options.allowedOrigins.includes(options.origin))
        return { status: "fallback", reason: "origin-not-allowed" };

      const request = nativeBridgeRequestSchema.safeParse({
        requestId: crypto.randomUUID(),
        version: BRIDGE_CONTRACT_VERSION,
        command: "open-native-route",
        payload: { route: manifest.nativeRoute },
      });
      if (!request.success)
        return { status: "fallback", reason: "invalid-payload" };
      try {
        const response = nativeBridgeResponseSchema.safeParse(
          await timeout(
            options.bridge.invoke(request.data),
            options.timeoutMs ?? 2_000,
          ),
        );
        if (
          !response.success ||
          response.data.requestId !== request.data.requestId
        ) {
          return { status: "fallback", reason: "bridge-rejected" };
        }
        return response.data.status === "success"
          ? { status: "opened" }
          : { status: "fallback", reason: "bridge-rejected" };
      } catch (error) {
        return {
          status: "fallback",
          reason:
            error instanceof Error && error.message === "bridge-timeout"
              ? "bridge-timeout"
              : "bridge-rejected",
        };
      }
    },
  };
}

/** Deterministic local stand-in for an authorized WebView host. */
export function createSimulatedNativeBridge(): NativeBridge {
  return {
    negotiate: () => ({
      version: BRIDGE_CONTRACT_VERSION,
      capabilities: ["native-navigation"],
    }),
    invoke: async (request) => ({
      requestId: request.requestId,
      status: "success",
    }),
  };
}
