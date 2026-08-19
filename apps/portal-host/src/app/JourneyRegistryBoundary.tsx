import { useQuery } from "@tanstack/react-query";
import { Button, Text } from "@portal/design-system-web";
import type { PlatformContext } from "@portal/platform-contracts";
import registry from "../assets/journey-registry.json";
import {
  JourneyRegistryError,
  journeyRegistryClient,
} from "../services/journey-registry/journey-registry";
import { Shell } from "./Shell";
import styles from "./styles.module.scss";
import type { AppProps, RegistrySource } from "./types";

type JourneyRegistryBoundaryProps = AppProps & {
  correlationContext: PlatformContext;
};

/** Resolves the remote journey catalog and preserves a safe local fallback. */
export function JourneyRegistryBoundary({
  registryData,
  journeyRegistryClient: registryClient = journeyRegistryClient,
  ...props
}: JourneyRegistryBoundaryProps) {
  const registryQuery = useQuery({
    queryKey: ["journey-registry"],
    queryFn: ({ signal }) =>
      registryClient.getJourneys(signal, props.correlationContext),
    enabled: registryData === undefined,
    retry: false,
  });
  const usingFallback = registryData === undefined && registryQuery.isError;
  const resolvedRegistry = registryData ?? registryQuery.data ?? registry;
  const registrySource: RegistrySource =
    registryData !== undefined
      ? "injected"
      : usingFallback
        ? "safe-fallback"
        : registryQuery.isSuccess
          ? "remote"
          : "bootstrap";
  const registryFailure =
    usingFallback && registryQuery.error instanceof JourneyRegistryError
      ? registryQuery.error.kind
      : undefined;

  return (
    <>
      {usingFallback ? (
        <div className={styles.registryFallback} role="alert">
          <Text>
            Não foi possível atualizar as jornadas. Exibimos o último catálogo
            seguro.
          </Text>
          <Button type="button" onClick={() => void registryQuery.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
      <Shell
        {...props}
        registryData={resolvedRegistry}
        registrySource={registrySource}
        registryFailure={registryFailure}
      />
    </>
  );
}
