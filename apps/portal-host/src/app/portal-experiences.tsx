import { useEffect, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  EmptyState,
  JourneyCard,
  SearchField,
  Spinner,
  Surface,
  Text,
} from "@portal/design-system-web";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import { notificationReadStore } from "./notification-read-store";
import {
  portalBffClient,
  type CatalogItem,
  type NotificationItem,
  type PortalBffClient,
} from "../services/portal-bff/portal-bff";
import styles from "./styles.module.scss";

type NavigateHandler = (
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
) => void;

/** Emits a transversal event with the mandatory, sanitized platform context. */
function track(
  platform: PlatformCapabilities,
  route: string,
  name: string,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    name,
    properties: {
      route,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra,
    },
  });
}

function QueryError({ title, retry }: { title: string; retry: () => void }) {
  return (
    <Alert tone="error" title={title}>
      <Button type="button" variant="secondary" onClick={retry}>
        Tentar novamente
      </Button>
    </Alert>
  );
}

function CatalogCards({
  items,
  onNavigate,
  platform,
}: {
  items: CatalogItem[];
  onNavigate: NavigateHandler;
  platform: PlatformCapabilities;
}) {
  return (
    <div className={styles.cardGrid}>
      {items.map((item) => (
        <JourneyCard
          key={item.id}
          href={item.route}
          title={item.title}
          description={item.description}
          onNavigate={(event) => {
            track(platform, "/", "portal.core.catalog.opened", {
              itemId: item.id,
            });
            onNavigate(event, item.route);
          }}
        />
      ))}
    </div>
  );
}

function NotificationItems({
  items,
  readIds,
  onRead,
}: {
  items: NotificationItem[];
  readIds: Set<string>;
  onRead: (item: NotificationItem) => void;
}) {
  const resolvedItems = items.map((item) => ({
    ...item,
    read: item.read || readIds.has(item.id),
  }));
  const unreadCount = resolvedItems.filter((item) => !item.read).length;
  return (
    <>
      <Text role="status" aria-live="polite">
        {unreadCount
          ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}`
          : "Todas as notificações foram lidas"}
      </Text>
      <ul className={styles.notifications}>
        {resolvedItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`${styles.notificationItem} ${item.read ? "" : styles.notificationItemUnread}`}
              aria-label={`${item.title}${item.read ? ", lida" : ", não lida"}`}
              onClick={() => !item.read && onRead(item)}
            >
              {!item.read ? (
                <span
                  className={styles.notificationIndicator}
                  aria-hidden="true"
                />
              ) : (
                <span aria-hidden="true" />
              )}
              <span className={styles.notificationContent}>
                <Text as="span" variant="label" weight="bold">
                  {item.title}
                </Text>
                <Text as="span">{item.summary}</Text>
                <Text as="span" tone="muted">
                  {item.read ? "Lida" : "Não lida"}
                </Text>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Renders the full notification route and its session-scoped read state. */
export function PortalNotifications({
  client = portalBffClient,
  platform,
}: {
  client?: PortalBffClient;
  platform: PlatformCapabilities;
}) {
  const query = useQuery({
    queryKey: ["portal", "notifications"],
    queryFn: ({ signal }) => client.getNotifications(signal),
    retry: false,
  });
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    notificationReadStore.read(),
  );

  useEffect(() => {
    track(platform, "/notificacoes", "portal.core.notifications.opened");
  }, [platform]);
  useEffect(() => {
    if (query.isSuccess) {
      setReadIds(
        notificationReadStore.reconcile(
          query.data.items.map((item) => item.id),
        ),
      );
      track(platform, "/notificacoes", "portal.core.data.loaded", {
        experience: "notifications",
        itemCount: query.data.items.length,
      });
    }
  }, [platform, query.data, query.isSuccess]);
  useEffect(() => {
    if (query.isError)
      track(platform, "/notificacoes", "portal.core.data.failed", {
        experience: "notifications",
      });
  }, [platform, query.isError]);

  const markRead = (item: NotificationItem) => {
    setReadIds(notificationReadStore.markRead(item.id));
    track(platform, "/notificacoes", "portal.core.notification.read", {
      notificationId: item.id,
    });
  };
  return (
    <section
      aria-labelledby="notifications-title"
      aria-busy={query.isPending || undefined}
    >
      <Text as="h1" variant="display" id="notifications-title">
        Notificações
      </Text>
      {query.isPending ? (
        <Spinner label="Carregando notificações" />
      ) : query.isError ? (
        <QueryError
          title="Não foi possível carregar as notificações"
          retry={() => void query.refetch()}
        />
      ) : query.data.items.length ? (
        <NotificationItems
          items={query.data.items}
          readIds={readIds}
          onRead={markRead}
        />
      ) : (
        <EmptyState
          title="Nenhuma notificação"
          description="Não há notificações para exibir."
        />
      )}
    </section>
  );
}

/** Renders the home search and Products catalog while keeping queries in the URL. */
export function PortalHome({
  client = portalBffClient,
  platform,
  onNavigate,
}: {
  client?: PortalBffClient;
  platform: PlatformCapabilities;
  onNavigate: NavigateHandler;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const submittedQuery =
    new URLSearchParams(location.search).get("q")?.trim() ?? "";
  const [draftQuery, setDraftQuery] = useState(submittedQuery);
  const catalogQuery = useQuery({
    queryKey: ["portal", "catalog", submittedQuery],
    queryFn: ({ signal }) =>
      submittedQuery
        ? client.searchCatalog(submittedQuery, signal)
        : client.getCatalog(signal),
    retry: false,
  });

  useEffect(() => setDraftQuery(submittedQuery), [submittedQuery]);
  useEffect(() => {
    if (catalogQuery.isSuccess)
      track(platform, "/", "portal.core.data.loaded", {
        experience: submittedQuery ? "search" : "catalog",
        itemCount: catalogQuery.data.items.length,
      });
  }, [catalogQuery.data, catalogQuery.isSuccess, platform, submittedQuery]);
  useEffect(() => {
    if (catalogQuery.isError)
      track(platform, "/", "portal.core.data.failed", {
        experience: submittedQuery ? "search" : "catalog",
      });
  }, [catalogQuery.isError, platform, submittedQuery]);

  const submitSearch = (value: string) => {
    const query = value.trim();
    track(platform, "/", "portal.core.search.submitted");
    navigate(query ? `/?q=${encodeURIComponent(query)}` : "/");
  };
  const clearSearch = () => {
    setDraftQuery("");
    navigate("/");
  };

  return (
    <div className={styles.home}>
      <Surface as="section" padding="lg" elevation={1}>
        <Text as="h1" variant="display">
          Portal Pessoas
        </Text>
        <Text tone="muted">Encontre jornadas e funcionalidades do portal.</Text>
        <SearchField
          label="Buscar no portal"
          value={draftQuery}
          onValueChange={setDraftQuery}
          onSearch={submitSearch}
          clearLabel="Limpar termo de busca"
          placeholder="Busque uma jornada"
        />
      </Surface>
      <section
        aria-labelledby="products-title"
        aria-busy={catalogQuery.isPending || undefined}
      >
        <Text as="h2" variant="heading" id="products-title">
          {submittedQuery ? `Resultados para “${submittedQuery}”` : "Produtos"}
        </Text>
        {catalogQuery.isPending ? (
          <Spinner
            label={
              submittedQuery ? "Buscando em Produtos" : "Carregando Produtos"
            }
          />
        ) : catalogQuery.isError ? (
          <QueryError
            title="Não foi possível carregar os Produtos"
            retry={() => void catalogQuery.refetch()}
          />
        ) : catalogQuery.data.items.length ? (
          <>
            <Text role="status" aria-live="polite">
              {catalogQuery.data.items.length} resultado
              {catalogQuery.data.items.length > 1 ? "s" : ""}
            </Text>
            <CatalogCards
              items={catalogQuery.data.items}
              onNavigate={onNavigate}
              platform={platform}
            />
          </>
        ) : (
          <EmptyState
            title={
              submittedQuery
                ? "Nenhum resultado encontrado"
                : "Nenhum produto disponível"
            }
            description={
              submittedQuery
                ? "Tente outro termo para buscar em Produtos."
                : "Não há produtos disponíveis no momento."
            }
            action={
              submittedQuery ? (
                <Button type="button" onClick={clearSearch}>
                  Limpar busca
                </Button>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
