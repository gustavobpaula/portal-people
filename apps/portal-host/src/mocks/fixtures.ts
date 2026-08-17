import type { CatalogItem, NotificationItem } from "../portal-bff";

export const catalogItems: CatalogItem[] = [
  {
    id: "neutral-journey",
    title: "Fundação da plataforma",
    description: "Conheça a jornada neutra carregada em runtime pelo portal.",
    route: "/foundation",
    keywords: ["fundação", "plataforma", "jornada", "contratos"],
  },
  {
    id: "beneficios",
    title: "Benefícios",
    description: "Consulte seus benefícios e as orientações para utilizá-los.",
    route: "/beneficios",
    keywords: ["benefícios", "beneficios", "vale-alimentação", "saúde", "bem-estar"],
  },
];

export const notifications: NotificationItem[] = [
  {
    id: "portal-welcome",
    title: "Portal atualizado",
    summary: "A nova navegação do Portal Pessoas está disponível.",
    read: false,
  },
  {
    id: "foundation-ready",
    title: "Jornada disponível",
    summary: "A jornada de fundação já pode ser acessada pelo catálogo.",
    read: true,
  },
];
