import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PlatformContext } from "@portal/platform-contracts";
import { createPlatformAdapter as defaultCreatePlatformAdapter } from "@portal/platform-mobile-bridge";
import { createTelemetry } from "@portal/platform-observability";
import type { AppProps } from "../types";

type UsePlatformAdapterOptions = Pick<
  AppProps,
  | "createCapabilities"
  | "createPlatformAdapter"
  | "platformMode"
  | "nativeBridge"
> & {
  correlationContext: PlatformContext;
};

/**
 * Creates the shell platform adapter once so remotes receive stable capabilities
 * throughout the lifetime of the mounted application.
 */
export function usePlatformAdapter({
  correlationContext,
  createCapabilities,
  createPlatformAdapter = defaultCreatePlatformAdapter,
  platformMode = "web",
  nativeBridge,
}: UsePlatformAdapterOptions) {
  const navigate = useNavigate();
  const [adapter] = useState(() => {
    const telemetry = createTelemetry(correlationContext);

    return createCapabilities
      ? {
          capabilities: createCapabilities({
            navigate: (path) => navigate(path),
            telemetry,
            context: correlationContext,
          }),
          openNativeRoute: async () => ({
            status: "fallback" as const,
            reason: "native-unavailable" as const,
          }),
        }
      : createPlatformAdapter({
          mode: platformMode,
          navigate: (path) => navigate(path),
          telemetry,
          context: correlationContext,
          origin: window.location.origin,
          allowedOrigins: ["http://localhost:4200"],
          bridge: nativeBridge,
        });
  });

  return adapter;
}
