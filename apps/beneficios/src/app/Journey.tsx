import { useEffect, useState, type MouseEvent } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { Route, Routes, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  EmptyState,
  Icon,
  JourneyCard,
  Spinner,
  Surface,
  Text,
} from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import {
  benefitsApiClient,
  BenefitsApiError,
  type BenefitDetail,
  type BenefitsApiClient,
} from "../services/api/benefits-api";
import styles from "./styles.module.scss";

const DOMAIN = "beneficios";
const VERSION = "1.0.0";
const STATUS_LABELS = { active: "Ativo", available: "Disponível" } as const;

function track(
  platform: PlatformCapabilities,
  name: string,
  route: string,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    kind: name.includes("failed")
      ? "error"
      : name.includes("loaded") || name.includes("retried")
        ? "log"
        : "analytics",
    name,
    properties: {
      domain: DOMAIN,
      version: VERSION,
      eventNamespace: DOMAIN,
      route,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra,
    },
  });
}

function shouldHandleNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function QueryError({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}) {
  return (
    <Alert tone="error" title={title}>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Tentar novamente
      </Button>
    </Alert>
  );
}

function BenefitsList({
  client,
  platform,
}: {
  client: BenefitsApiClient;
  platform: PlatformCapabilities;
}) {
  const query = useQuery({
    queryKey: [DOMAIN, "list"],
    queryFn: ({ signal }) => client.getBenefits(signal),
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess)
      track(platform, "beneficios.list.loaded", "/beneficios", {
        itemCount: query.data.items.length,
      });
  }, [platform, query.data, query.isSuccess]);
  useEffect(() => {
    if (query.isError)
      track(platform, "beneficios.data.failed", "/beneficios", {
        resource: "list",
        reason:
          query.error instanceof BenefitsApiError
            ? query.error.kind
            : "unknown",
      });
  }, [platform, query.error, query.isError]);

  const retry = () => {
    track(platform, "beneficios.data.retried", "/beneficios", {
      resource: "list",
    });
    void query.refetch();
  };

  return (
    <section
      aria-labelledby="beneficios-title"
      aria-busy={query.isPending || undefined}
    >
      <Text as="h1" variant="display" id="beneficios-title">
        Meus benefícios
      </Text>
      <Text tone="muted">Consulte os benefícios disponíveis para você.</Text>
      {query.isPending ? (
        <Spinner label="Carregando benefícios" />
      ) : query.isError ? (
        <QueryError
          title="Não foi possível carregar os benefícios"
          onRetry={retry}
        />
      ) : query.data.items.length ? (
        <>
          <Text role="status" aria-live="polite">
            {query.data.items.length} benefício
            {query.data.items.length > 1 ? "s" : ""} encontrado
            {query.data.items.length > 1 ? "s" : ""}
          </Text>
          <div className={styles.cardGrid}>
            {query.data.items.map((benefit) => (
              <JourneyCard
                key={benefit.id}
                href={`/beneficios/${benefit.id}`}
                title={benefit.name}
                description={benefit.summary}
                icon="gift"
                eyebrow={benefit.category}
                badge={STATUS_LABELS[benefit.status]}
                onNavigate={(event) => {
                  if (!shouldHandleNavigation(event)) return;
                  event.preventDefault();
                  platform.navigate(`/beneficios/${benefit.id}`);
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon="gift"
          title="Nenhum benefício disponível"
          description="Não há benefícios para exibir no momento."
        />
      )}
    </section>
  );
}

function BenefitDetails({
  client,
  platform,
}: {
  client: BenefitsApiClient;
  platform: PlatformCapabilities;
}) {
  const { beneficioId = "" } = useParams();
  const query = useQuery({
    queryKey: [DOMAIN, "detail", beneficioId],
    queryFn: ({ signal }) => client.getBenefit(beneficioId, signal),
    enabled: Boolean(beneficioId),
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess)
      track(platform, "beneficios.detail.opened", "/beneficios/:beneficioId");
  }, [platform, query.isSuccess]);
  useEffect(() => {
    if (query.isError)
      track(platform, "beneficios.data.failed", "/beneficios/:beneficioId", {
        resource: "detail",
        reason:
          query.error instanceof BenefitsApiError
            ? query.error.kind
            : "unknown",
      });
  }, [platform, query.error, query.isError]);

  const backToList = () => platform.navigate("/beneficios");
  const retry = () => {
    track(platform, "beneficios.data.retried", "/beneficios/:beneficioId", {
      resource: "detail",
    });
    void query.refetch();
  };

  if (query.isPending)
    return <Spinner label="Carregando detalhe do benefício" />;
  if (
    query.isError &&
    query.error instanceof BenefitsApiError &&
    query.error.kind === "not-found"
  )
    return (
      <EmptyState
        icon="gift"
        title="Benefício não encontrado"
        description="O benefício solicitado não está disponível."
        action={
          <Button type="button" onClick={backToList}>
            Voltar aos benefícios
          </Button>
        }
      />
    );
  if (query.isError)
    return (
      <QueryError
        title="Não foi possível carregar o benefício"
        onRetry={retry}
      />
    );

  return <BenefitDetailView benefit={query.data} onBack={backToList} />;
}

function BenefitDetailView({
  benefit,
  onBack,
}: {
  benefit: BenefitDetail;
  onBack: () => void;
}) {
  return (
    <section aria-labelledby="beneficio-detail-title">
      <Button
        type="button"
        variant="ghost"
        startIcon={<Icon name="arrow-left" />}
        onClick={onBack}
      >
        Voltar aos benefícios
      </Button>
      <Surface
        as="article"
        padding="lg"
        elevation={1}
        className={styles.detailSurface}
      >
        <Text as="p" variant="label" tone="muted">
          {benefit.category} · {STATUS_LABELS[benefit.status]}
        </Text>
        <Text as="h1" variant="display" id="beneficio-detail-title">
          {benefit.name}
        </Text>
        <Text>{benefit.description}</Text>
        <div className={styles.detailSection}>
          <Text as="h2" variant="heading">
            Como utilizar
          </Text>
          <Text>{benefit.usageInstructions}</Text>
        </div>
      </Surface>
    </section>
  );
}

export function BenefitsApp({
  client = benefitsApiClient,
  platform,
}: {
  client?: BenefitsApiClient;
  platform: PlatformCapabilities;
}) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route
          index
          element={<BenefitsList client={client} platform={platform} />}
        />
        <Route
          path=":beneficioId"
          element={<BenefitDetails client={client} platform={platform} />}
        />
      </Routes>
    </QueryClientProvider>
  );
}

export default function Journey({
  platform,
}: {
  platform: PlatformCapabilities;
}) {
  return <BenefitsApp platform={platform} />;
}
