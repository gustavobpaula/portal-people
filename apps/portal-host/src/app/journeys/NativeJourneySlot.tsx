import { useEffect, useRef, useState } from "react";
import { Alert, Button, Spinner, Text } from "@portal/design-system-web";
import type {
  PlatformAdapter,
  NativeRouteFailureReason,
} from "@portal/platform-mobile-bridge";
import { useNavigate } from "react-router-dom";
import styles from "../styles.module.scss";
import type { NativeManifest } from "../types";
import { trackJourney } from "./telemetry";

const messages: Record<NativeRouteFailureReason, string> = {
  "native-unavailable": "Este recurso está disponível apenas no aplicativo.",
  "bridge-unavailable": "Não foi possível acessar os recursos do aplicativo.",
  "bridge-incompatible": "Atualize o aplicativo para continuar.",
  "capability-unavailable":
    "Este recurso não está disponível nesta versão do aplicativo.",
  "origin-not-allowed":
    "A origem atual não pode acessar os recursos do aplicativo.",
  "invalid-payload": "Não foi possível preparar o recurso do aplicativo.",
  "bridge-timeout": "O aplicativo demorou mais que o esperado para responder.",
  "bridge-rejected": "O aplicativo não pôde abrir este recurso agora.",
};

const retryable = new Set<NativeRouteFailureReason>([
  "bridge-unavailable",
  "bridge-timeout",
  "bridge-rejected",
]);

export function NativeJourneySlot({
  manifest,
  adapter,
}: {
  manifest: NativeManifest;
  adapter: PlatformAdapter;
}) {
  const navigate = useNavigate();
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<
    "loading" | "opened" | NativeRouteFailureReason
  >("loading");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setState("loading");
    trackJourney(
      adapter.capabilities,
      "portal.journey.native.activation.started",
      manifest,
    );
    void adapter.openNativeRoute(manifest).then((result) => {
      if (result.status === "opened") {
        setState("opened");
        trackJourney(
          adapter.capabilities,
          "portal.journey.native.opened",
          manifest,
        );
        return;
      }
      setState(result.reason);
      trackJourney(
        adapter.capabilities,
        "portal.journey.native.failed",
        manifest,
        { reason: result.reason },
      );
      trackJourney(
        adapter.capabilities,
        "portal.journey.native.fallback.shown",
        manifest,
        { reason: result.reason },
      );
    });
  }, [adapter, attempt, manifest]);

  const retry = () => {
    started.current = false;
    trackJourney(
      adapter.capabilities,
      "portal.journey.native.retried",
      manifest,
    );
    setAttempt((current) => current + 1);
  };

  if (state === "loading")
    return (
      <div className={styles.loading}>
        <Spinner
          size="lg"
          label={`Abrindo ${manifest.displayName ?? manifest.id}`}
        />
      </div>
    );
  if (state === "opened")
    return (
      <>
        <Text as="h1" variant="heading">
          Recursos do aplicativo aberto
        </Text>
        <Alert tone="success" title="Navegação concluída">
          <Text>O aplicativo recebeu a navegação solicitada.</Text>
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/")}
            >
              Voltar ao portal
            </Button>
          </div>
        </Alert>
      </>
    );
  return (
    <>
      <Text as="h1" variant="heading">
        Jornada indisponível
      </Text>
      <Alert tone="error" title="Não foi possível abrir este recurso">
        <Text>{messages[state]}</Text>
        <div className={styles.actions}>
          {retryable.has(state) ? (
            <Button type="button" onClick={retry}>
              Tentar novamente
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/")}
          >
            Voltar ao portal
          </Button>
        </div>
      </Alert>
    </>
  );
}
