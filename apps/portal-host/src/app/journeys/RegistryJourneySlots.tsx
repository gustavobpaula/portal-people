import { useEffect } from "react";
import { Spinner } from "@portal/design-system-web";
import type { JourneyManifest, PlatformCapabilities } from "@portal/platform-contracts";
import { useNavigate, useParams } from "react-router-dom";
import { JourneyFallback } from "./JourneyFallback";
import { trackJourney, trackRegistry } from "./telemetry";

export function RejectedJourneySlot({ route, platform, onRetry }: { route: string; platform: PlatformCapabilities; onRetry: () => void }) {
  const navigate = useNavigate();
  useEffect(() => { trackRegistry(platform, "portal.journey.load.failed", route, { reason: "invalid-manifest" }); }, [platform, route]);
  return <JourneyFallback reason="invalid-manifest" onRetry={onRetry} onReturn={() => navigate("/")} />;
}

export function ExternalReturn({ journeys, platform }: { journeys: JourneyManifest[]; platform: PlatformCapabilities }) {
  const navigate = useNavigate();
  const { journeyId } = useParams();
  const expectedReturnRoute = journeyId ? `/retorno/${journeyId}` : undefined;
  const manifest = journeys.find((journey) => journey.id === journeyId && journey.strategy === "external-web" && journey.returnRoute === expectedReturnRoute);
  useEffect(() => {
    if (manifest) { trackJourney(platform, "portal.journey.external.returned", manifest); navigate("/", { replace: true }); return; }
    trackRegistry(platform, "portal.journey.load.failed", expectedReturnRoute ?? "/retorno", { reason: "invalid-return-route" });
  }, [expectedReturnRoute, manifest, navigate, platform]);
  if (!manifest) return <JourneyFallback reason="invalid-return-route" onRetry={() => { trackRegistry(platform, "portal.journey.load.retried", expectedReturnRoute ?? "/retorno", { reason: "invalid-return-route" }); window.location.reload(); }} onReturn={() => navigate("/")} />;
  return <Spinner label="Retornando ao Portal Pessoas" />;
}
