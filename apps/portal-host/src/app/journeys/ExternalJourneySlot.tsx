import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import { prepareExternalJourney } from "@portal/platform-runtime";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.scss";
import type { ExternalManifest } from "../types";
import { JourneyFallback } from "./JourneyFallback";
import { trackJourney } from "./telemetry";

export function ExternalJourneySlot({
  manifest,
  platform,
  allowedOrigins,
  checkExternalAvailability,
  navigateExternal,
}: {
  manifest: ExternalManifest;
  platform: PlatformCapabilities;
  allowedOrigins: readonly string[];
  checkExternalAvailability: (
    destination: string,
    platform?: PlatformCapabilities,
  ) => Promise<boolean>;
  navigateExternal: (destination: string) => void;
}) {
  const navigate = useNavigate();
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const prepared = useMemo(
    () =>
      prepareExternalJourney(manifest, allowedOrigins, window.location.origin),
    [allowedOrigins, manifest],
  );

  useEffect(() => {
    if (prepared.status === "fallback")
      trackJourney(platform, "portal.journey.load.failed", manifest, {
        reason: prepared.reason,
      });
  }, [manifest, platform, prepared]);
  useEffect(() => {
    if (prepared.status !== "ready" || started.current) return;
    let active = true;
    setUnavailable(false);
    void checkExternalAvailability(prepared.destination, platform).then(
      (available) => {
        if (!active) return;
        if (!available) {
          setUnavailable(true);
          trackJourney(platform, "portal.journey.load.failed", manifest, {
            reason: "external-unavailable",
          });
          return;
        }
        started.current = true;
        trackJourney(
          platform,
          "portal.journey.external.transitioned",
          manifest,
        );
        navigateExternal(prepared.destination);
      },
    );
    return () => {
      active = false;
    };
  }, [
    attempt,
    checkExternalAvailability,
    manifest,
    navigateExternal,
    platform,
    prepared,
  ]);

  const retry = () => {
    trackJourney(platform, "portal.journey.load.retried", manifest, {
      reason: "external-unavailable",
    });
    started.current = false;
    setAttempt((current) => current + 1);
  };
  if (prepared.status === "fallback")
    return (
      <JourneyFallback
        reason={prepared.reason}
        onRetry={() => window.location.reload()}
        onReturn={() => navigate("/")}
      />
    );
  if (unavailable)
    return (
      <JourneyFallback
        reason="external-unavailable"
        onRetry={retry}
        onReturn={() => navigate("/")}
      />
    );
  return (
    <div className={styles.loading}>
      <Spinner
        size="lg"
        label={`Abrindo ${manifest.displayName ?? manifest.id}`}
      />
    </div>
  );
}
