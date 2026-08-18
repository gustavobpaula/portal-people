import { Button, Alert, Text } from "@portal/design-system-web";
import styles from "../styles.module.scss";

export type JourneyFallbackReason =
  | "invalid-manifest"
  | "incompatible-contract"
  | "remote-timeout"
  | "remote-unavailable"
  | "render-error"
  | "external-origin-not-allowed"
  | "external-unavailable"
  | "invalid-return-route";

const messages: Record<JourneyFallbackReason, string> = {
  "invalid-manifest": "A configuração da jornada não é válida.",
  "incompatible-contract": "A jornada requer uma versão incompatível da plataforma.",
  "remote-timeout": "A jornada demorou mais que o esperado para responder.",
  "remote-unavailable": "A jornada está temporariamente indisponível.",
  "render-error": "A jornada encontrou um erro ao ser exibida.",
  "external-origin-not-allowed": "O destino externo não é permitido pela plataforma.",
  "external-unavailable": "A jornada está temporariamente indisponível.",
  "invalid-return-route": "A rota de retorno da jornada não é válida.",
};

export function JourneyFallback({
  reason,
  onRetry,
  onReturn,
}: {
  reason: JourneyFallbackReason;
  onRetry: () => void;
  onReturn: () => void;
}) {
  return (
    <Alert tone="error" title="Jornada indisponível">
      <Text>{messages[reason]}</Text>
      <div className={styles.actions}>
        <Button type="button" onClick={onRetry}>Tentar novamente</Button>
        <Button type="button" variant="secondary" onClick={onReturn}>Voltar ao portal</Button>
      </div>
    </Alert>
  );
}
