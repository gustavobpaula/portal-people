import { zodResolver } from "@hookform/resolvers/zod";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Button,
  EmptyState,
  Icon,
  Spinner,
  Surface,
  Text,
  TextField,
} from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import {
  VacationsApiError,
  vacationsApiClient,
  type VacationSubmission,
  type VacationsApiClient,
} from "../services/api/vacations-api";
import {
  calculateEndDate,
  createVacationRequestSchema,
  type AvailableVacationEligibility,
  type VacationRequestInput,
} from "../domain/vacation-rules";
import styles from "./styles.module.scss";

const DOMAIN = "ferias";
const VERSION = "1.0.0";
const ROUTE = "/ferias";

function track(
  platform: PlatformCapabilities,
  name: string,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    name,
    properties: {
      domain: DOMAIN,
      version: VERSION,
      route: ROUTE,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra,
    },
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function EligibilityError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert tone="error" title="Não foi possível consultar suas férias">
      <Button type="button" variant="secondary" onClick={onRetry}>
        Tentar novamente
      </Button>
    </Alert>
  );
}

function VacationForm({
  eligibility,
  initialRequest,
  platform,
  onReview,
}: {
  eligibility: AvailableVacationEligibility;
  initialRequest?: VacationRequestInput;
  platform: PlatformCapabilities;
  onReview: (request: VacationRequestInput) => void;
}) {
  const formSchema = useMemo(
    () => createVacationRequestSchema(eligibility),
    [eligibility],
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VacationRequestInput>({
    resolver: zodResolver(formSchema),
    defaultValues: initialRequest ?? { startDate: "", days: undefined },
    shouldFocusError: true,
  });
  return (
    <Surface
      as="section"
      padding="lg"
      elevation={1}
      className={styles.formSurface}
    >
      <Text as="h2" variant="heading">
        Solicitar férias
      </Text>
      <Text tone="muted">
        Saldo disponível: {eligibility.availableDays} dias. Escolha um período
        entre {formatDate(eligibility.eligiblePeriod.startsOn)} e{" "}
        {formatDate(eligibility.eligiblePeriod.endsOn)}.
      </Text>
      <form
        noValidate
        className={styles.journey}
        onSubmit={handleSubmit(onReview, () =>
          track(platform, "ferias.form.validation_failed", {
            reason: "form-invalid",
          }),
        )}
      >
        <TextField
          type="date"
          label="Data de início"
          min={eligibility.eligiblePeriod.startsOn}
          max={eligibility.eligiblePeriod.endsOn}
          error={errors.startDate?.message}
          {...register("startDate")}
        />
        <TextField
          type="number"
          label="Quantidade de dias"
          min="1"
          max={eligibility.availableDays}
          step="1"
          error={errors.days?.message}
          {...register("days", { valueAsNumber: true })}
        />
        <div className={styles.actions}>
          <Button type="submit">Revisar solicitação</Button>
        </div>
      </form>
    </Surface>
  );
}

function Review({
  request,
  platform,
  submission,
  onEdit,
  onSuccess,
}: {
  request: VacationRequestInput;
  platform: PlatformCapabilities;
  submission: ReturnType<
    typeof useMutation<VacationSubmission, Error, VacationRequestInput>
  >;
  onEdit: () => void;
  onSuccess: (value: VacationSubmission) => void;
}) {
  const headingRef = useRef<HTMLDivElement>(null);
  const endDate = calculateEndDate(request.startDate, request.days);
  useEffect(() => headingRef.current?.focus(), []);
  const error = submission.error;
  const validationFailed =
    error instanceof VacationsApiError && error.kind === "validation";
  const submit = (retry = false) => {
    track(
      platform,
      retry ? "ferias.request.retried" : "ferias.request.submission_started",
      { resource: "request" },
    );
    submission.mutate(request, { onSuccess });
  };
  return (
    <Surface
      as="section"
      padding="lg"
      elevation={1}
      className={styles.reviewSurface}
    >
      <div ref={headingRef} tabIndex={-1} className={styles.focusTarget}>
        <Text as="h2" variant="heading">
          Revise sua solicitação
        </Text>
      </div>
      {error ? (
        <Alert
          tone="error"
          title={
            validationFailed
              ? "Os dados não são mais válidos"
              : "Não foi possível enviar a solicitação"
          }
        >
          <Text>
            {validationFailed
              ? "Revise os dados antes de enviar novamente."
              : "Seus dados foram preservados para uma nova tentativa."}
          </Text>
        </Alert>
      ) : null}
      <dl className={styles.summary}>
        <dt>
          <Text as="span" variant="label">
            Data de início
          </Text>
        </dt>
        <dd>
          <Text as="span">{formatDate(request.startDate)}</Text>
        </dd>
        <dt>
          <Text as="span" variant="label">
            Quantidade
          </Text>
        </dt>
        <dd>
          <Text as="span">{request.days} dias</Text>
        </dd>
        <dt>
          <Text as="span" variant="label">
            Período solicitado
          </Text>
        </dt>
        <dd>
          <Text as="span">
            {formatDate(request.startDate)} a {formatDate(endDate)}
          </Text>
        </dd>
      </dl>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onEdit}>
          Editar solicitação
        </Button>
        {validationFailed ? null : (
          <Button
            type="button"
            loading={submission.isPending}
            loadingLabel="Enviando solicitação"
            onClick={() => submit(Boolean(error))}
          >
            Confirmar solicitação
          </Button>
        )}
      </div>
    </Surface>
  );
}

function Confirmation({ value }: { value: VacationSubmission }) {
  const headingRef = useRef<HTMLDivElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <Surface
      as="section"
      padding="lg"
      elevation={1}
      className={styles.confirmationSurface}
    >
      <Icon name="success" size="lg" />
      <div ref={headingRef} tabIndex={-1} className={styles.focusTarget}>
        <Text as="h2" variant="heading">
          Solicitação enviada
        </Text>
      </div>
      <Text role="status">Sua solicitação foi enviada para análise.</Text>
      <dl className={styles.summary}>
        <dt>
          <Text as="span" variant="label">
            Protocolo
          </Text>
        </dt>
        <dd>
          <Text as="span">{value.protocol}</Text>
        </dd>
        <dt>
          <Text as="span" variant="label">
            Período solicitado
          </Text>
        </dt>
        <dd>
          <Text as="span">
            {formatDate(value.startDate)} a {formatDate(value.endDate)}
          </Text>
        </dd>
        <dt>
          <Text as="span" variant="label">
            Quantidade
          </Text>
        </dt>
        <dd>
          <Text as="span">{value.days} dias</Text>
        </dd>
        <dt>
          <Text as="span" variant="label">
            Status
          </Text>
        </dt>
        <dd>
          <Text as="span">Solicitação enviada</Text>
        </dd>
      </dl>
    </Surface>
  );
}

function VacationJourney({
  client,
  platform,
}: {
  client: VacationsApiClient;
  platform: PlatformCapabilities;
}) {
  const [step, setStep] = useState<"form" | "review" | "success">("form");
  const [request, setRequest] = useState<VacationRequestInput>();
  const [confirmation, setConfirmation] = useState<VacationSubmission>();
  const eligibility = useQuery({
    queryKey: [DOMAIN, "eligibility"],
    queryFn: ({ signal }) => client.getEligibility(signal),
    retry: false,
  });
  const submission = useMutation({
    mutationFn: (value: VacationRequestInput) => client.submitRequest(value),
    retry: false,
  });
  useEffect(() => {
    if (eligibility.isSuccess)
      track(platform, "ferias.eligibility.loaded", { resource: "eligibility" });
  }, [eligibility.isSuccess, platform]);
  useEffect(() => {
    if (eligibility.isError)
      track(platform, "ferias.eligibility.failed", { resource: "eligibility" });
  }, [eligibility.isError, platform]);
  useEffect(() => {
    if (submission.isError)
      track(platform, "ferias.request.failed", {
        reason:
          submission.error instanceof VacationsApiError
            ? submission.error.kind
            : "unknown",
      });
  }, [platform, submission.error, submission.isError]);
  const retryEligibility = () => {
    track(platform, "ferias.eligibility.retried", { resource: "eligibility" });
    void eligibility.refetch();
  };
  const review = (value: VacationRequestInput) => {
    setRequest(value);
    submission.reset();
    setStep("review");
    track(platform, "ferias.request.reviewed", { resource: "request" });
  };
  const edit = () => {
    submission.reset();
    setStep("form");
  };
  const success = (value: VacationSubmission) => {
    setConfirmation(value);
    setStep("success");
    track(platform, "ferias.request.submitted", { resource: "request" });
  };
  return (
    <section
      className={styles.journey}
      aria-labelledby="ferias-title"
      aria-busy={eligibility.isPending || undefined}
    >
      <Text as="h1" variant="display" id="ferias-title">
        Férias
      </Text>
      <Text tone="muted">Planeje e envie uma nova solicitação de férias.</Text>
      {eligibility.isPending ? (
        <Spinner label="Carregando elegibilidade de férias" />
      ) : null}
      {eligibility.isError ? (
        <EligibilityError onRetry={retryEligibility} />
      ) : null}
      {eligibility.data?.status === "balance-unavailable" ? (
        <EmptyState
          icon="calendar"
          title="Saldo indisponível"
          description="Não foi possível obter seu saldo de férias agora."
          action={
            <Button type="button" onClick={retryEligibility}>
              Tentar novamente
            </Button>
          }
        />
      ) : null}
      {eligibility.data?.status === "no-eligible-days" ? (
        <EmptyState
          icon="calendar"
          title="Não há dias de férias elegíveis"
          description="Não há dias disponíveis para uma nova solicitação no momento."
        />
      ) : null}
      {eligibility.data?.status === "available" && step === "form" ? (
        <VacationForm
          eligibility={eligibility.data}
          initialRequest={request}
          platform={platform}
          onReview={review}
        />
      ) : null}
      {eligibility.data?.status === "available" &&
      step === "review" &&
      request ? (
        <Review
          request={request}
          platform={platform}
          submission={submission}
          onEdit={edit}
          onSuccess={success}
        />
      ) : null}
      {step === "success" && confirmation ? (
        <Confirmation value={confirmation} />
      ) : null}
    </section>
  );
}

export function VacationsApp({
  client = vacationsApiClient,
  platform,
}: {
  client?: VacationsApiClient;
  platform: PlatformCapabilities;
}) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <VacationJourney client={client} platform={platform} />
    </QueryClientProvider>
  );
}

export default function Journey({
  platform,
}: {
  platform: PlatformCapabilities;
}) {
  return <VacationsApp platform={platform} />;
}
