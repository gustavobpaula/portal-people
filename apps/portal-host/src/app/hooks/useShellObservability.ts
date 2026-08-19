import { useEffect, useRef } from "react";
import { onCLS, onINP, onLCP } from "web-vitals";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import type { JourneyRegistryError } from "../../services/journey-registry/journey-registry";
import type { RegistrySource } from "../types";

type ShellObservation = {
  route: string;
  registrySource: RegistrySource;
  registryFailure?: JourneyRegistryError["kind"];
  validJourneyCount: number;
  invalidJourneyCount: number;
};

/**
 * Registers shell-wide browser signals and emits sanitized registry telemetry.
 * Browser listeners are removed when the shell is unmounted.
 */
export function useShellObservability(
  platform: PlatformCapabilities,
  observation: ShellObservation,
) {
  const vitalsStarted = useRef(false);

  useEffect(() => {
    if (vitalsStarted.current) return;
    vitalsStarted.current = true;
    const report = (metric: {
      name: string;
      value: number;
      rating: string;
      navigationType: string;
    }) =>
      platform.telemetry.track({
        kind: "metric",
        name: `portal.web-vital.${metric.name.toLowerCase()}`,
        properties: {
          domain: "portal",
          version: "1.0.0",
          route: "/",
          eventNamespace: "portal-core",
          value: Math.round(metric.value),
          rating: metric.rating,
          navigationType: metric.navigationType,
        },
      });
    onCLS(report, { reportAllChanges: true });
    onINP(report);
    onLCP(report);
  }, [platform]);

  useEffect(() => {
    const report = (name: string) =>
      platform.telemetry.track({
        kind: "error",
        name,
        properties: {
          domain: "portal",
          version: "1.0.0",
          route: "/",
          eventNamespace: "portal-core",
          reason: "unhandled",
        },
      });
    const onError = () => report("portal.runtime.error");
    const onRejection = () => report("portal.runtime.rejection");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [platform]);

  useEffect(() => {
    if (observation.registrySource === "bootstrap") return;
    platform.telemetry.track({
      name: "portal.registry.resolved",
      properties: {
        route: observation.route,
        source: observation.registrySource,
        validCount: observation.validJourneyCount,
        invalidCount: observation.invalidJourneyCount,
        platform: platform.context.platform,
        correlationId: platform.context.correlationId,
      },
    });
  }, [
    observation.invalidJourneyCount,
    observation.registrySource,
    observation.route,
    observation.validJourneyCount,
    platform,
  ]);

  useEffect(() => {
    if (!observation.registryFailure) return;
    const properties = {
      route: observation.route,
      reason: observation.registryFailure,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
    };
    platform.telemetry.track({
      name: "portal.registry.fetch.failed",
      properties,
    });
    platform.telemetry.track({
      name: "portal.registry.fallback.shown",
      properties,
    });
  }, [observation.registryFailure, observation.route, platform]);
}
