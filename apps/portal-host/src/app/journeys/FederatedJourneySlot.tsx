import { Component, useEffect, useState, type ReactNode } from "react";
import { Spinner } from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import type { JourneyLoadResult } from "@portal/platform-runtime";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.scss";
import type { FederatedManifest, JourneyLoader } from "../types";
import { JourneyFallback } from "./JourneyFallback";
import { trackJourney } from "./telemetry";

function label(manifest: FederatedManifest) {
  return manifest.displayName ?? manifest.id;
}

class JourneyErrorBoundary extends Component<
  { onError: () => void; onRetry: () => void; onReturn: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    return this.state.failed ? (
      <JourneyFallback reason="render-error" onRetry={this.props.onRetry} onReturn={this.props.onReturn} />
    ) : this.props.children;
  }
}

export function FederatedJourneySlot({
  manifest,
  platform,
  loadJourney,
}: {
  manifest: FederatedManifest;
  platform: PlatformCapabilities;
  loadJourney: JourneyLoader;
}) {
  const navigate = useNavigate();
  const [result, setResult] = useState<JourneyLoadResult>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    trackJourney(platform, attempt ? "portal.journey.load.retried" : "portal.journey.load.started", manifest, attempt ? { attempt } : {});
    void loadJourney(manifest).then((next) => {
      if (!active) return;
      setResult(next);
      trackJourney(platform, next.status === "ready" ? "portal.journey.load.succeeded" : "portal.journey.load.failed", manifest, next.status === "ready" ? {} : { reason: next.reason });
    });
    return () => { active = false; };
  }, [attempt, loadJourney, manifest, platform]);

  const retry = () => { setResult(undefined); setAttempt((value) => value + 1); };
  if (!result) return <div className={styles.loading}><Spinner size="lg" label={`Carregando ${label(manifest)}`} /></div>;
  if (result.status === "fallback") return <JourneyFallback reason={result.reason} onRetry={retry} onReturn={() => navigate("/")} />;

  const Journey = result.module.default;
  return <JourneyErrorBoundary key={attempt} onError={() => trackJourney(platform, "portal.journey.load.failed", manifest, { reason: "render-error" })} onRetry={retry} onReturn={() => navigate("/")}><Journey platform={platform} /></JourneyErrorBoundary>;
}
