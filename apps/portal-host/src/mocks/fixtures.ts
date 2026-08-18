import type { CatalogItem, NotificationItem } from "../services/portal-bff/portal-bff";

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
  {
    id: "ferias",
    title: "Férias",
    description: "Planeje e envie uma nova solicitação de férias.",
    route: "/ferias",
    keywords: ["férias", "ferias", "solicitação", "descanso"],
  },
  {
    id: "holerite-legado",
    title: "Holerite legado",
    description: "Consulte holerites no sistema anterior de folha de pagamento.",
    route: "/holerite",
    keywords: ["holerite", "contracheque", "folha", "pagamento", "legado"],
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
