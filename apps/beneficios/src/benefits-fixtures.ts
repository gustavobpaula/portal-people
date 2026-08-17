import type { BenefitDetail } from "./benefits-api";

export const benefitFixtures: BenefitDetail[] = [
  {
    id: "vale-alimentacao",
    name: "Vale-alimentação",
    category: "Alimentação",
    status: "active",
    summary: "Crédito mensal para apoiar suas refeições.",
    description: "Use o benefício em estabelecimentos participantes para compras de alimentação.",
    usageInstructions: "Consulte o saldo e as condições no aplicativo do benefício antes de utilizar.",
  },
  {
    id: "assistencia-medica",
    name: "Assistência médica",
    category: "Saúde",
    status: "active",
    summary: "Cobertura de saúde disponível para consulta.",
    description: "Encontre informações gerais sobre sua cobertura de assistência médica.",
    usageInstructions: "Use os canais indicados pelo plano para consultar rede credenciada e orientações.",
  },
  {
    id: "auxilio-bem-estar",
    name: "Auxílio bem-estar",
    category: "Bem-estar",
    status: "available",
    summary: "Opções disponíveis para apoiar sua rotina de bem-estar.",
    description: "Conheça as opções de bem-estar oferecidas nesta jornada demonstrativa.",
    usageInstructions: "Leia as condições de uso disponíveis no canal do benefício.",
  },
];

export const benefitSummaries = benefitFixtures.map((benefit) => ({
  id: benefit.id,
  name: benefit.name,
  category: benefit.category,
  status: benefit.status,
  summary: benefit.summary,
}));
