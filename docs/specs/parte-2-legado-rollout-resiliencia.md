# Feature Specification: Parte 2 — Legado, Rollout e Resiliência

## Goal

Demonstrar a convivência segura entre Benefícios e Férias modernos e uma jornada legada externa distinta, mantendo retorno controlado e isolamento de falhas. A estratégia de rollout deve ser explicada como responsabilidade externa, sem reimplementar no monorepo canais de release, segmentação, percentuais, promoção ou rollback.

## Functional Requirements

- **FR-1:** Produtos deve manter Benefícios e Férias como jornadas modernas `federated-module` e apresentar uma única entrada distinta “Holerite legado” como `external-web`.
- **FR-2:** Holerite legado deve executar em origem distinta, apresentar conteúdo consultivo exclusivamente sintético e oferecer uma ação de retorno para uma rota autorizada do Portal Pessoas.
- **FR-3:** Ao resolver um destino `external-web`, o shell deve validar manifesto, compatibilidade, allowlist e rota de retorno, criar correlação, registrar a transição e navegar sem incluir tokens, matrícula ou dados pessoais na URL. Manifesto inválido, origem não permitida ou destino indisponível devem preservar o shell e as jornadas modernas.
- **FR-4:** O shell deve consumir o destino já resolvido presente no manifesto e não deve selecionar versões por perfil, grupo, percentual, query string, armazenamento local ou cookie. Versão e compatibilidade permanecem somente como metadados técnicos.
- **FR-5:** A documentação deve atribuir build e publicação ao CI/CD; artefatos imutáveis ao repositório de releases; Canary, Blue-Green, promoção e rollback à plataforma de deployment; públicos específicos a feature flags ou backend; e entrega de jornadas autorizadas já resolvidas ao Journey Registry.
- **FR-6:** Carregamento externo, transição, retorno, fallback e nova tentativa devem emitir eventos sanitizados com domínio, versão, rota, plataforma e correlação quando disponíveis, sem identificadores de grupo, tokens, matrícula ou dados pessoais.

## Acceptance Criteria

- **AC-1 [FR-1]:** Produtos apresenta Benefícios, Férias e uma única entrada “Holerite legado”; as jornadas modernas carregam seus remotes independentes e Holerite abre o destino externo.
- **AC-2 [FR-2]:** Holerite legado abre em origem distinta, apresenta dados sintéticos e oferece uma ação que retorna para uma rota autorizada do Portal Pessoas.
- **AC-3 [FR-3]:** A URL externa contém somente o parâmetro de retorno necessário. Manifesto inválido, origem não permitida e indisponibilidade apresentam fallback ou retorno controlado, enquanto Benefícios, Férias e a navegação do shell permanecem utilizáveis.
- **AC-4 [FR-4]:** Schemas, manifestos e código do shell não possuem audiência, percentual, candidate, stable ou decisão de rollout, e nenhuma entrada do navegador altera o destino registrado.
- **AC-5 [FR-5]:** Arquitetura, proposta técnica e README distinguem as responsabilidades do monorepo, CI/CD, plataforma de deployment, feature flags e Journey Registry; a aplicação não contém simulador de promoção ou divisão de tráfego.
- **AC-6 [FR-6]:** Testes verificam os eventos externos e confirmam que seus payloads não contêm tokens, matrícula ou dados pessoais.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-3, AD-13 e AD-17–AD-21 após o alinhamento das responsabilidades operacionais.
- Cobrir `docs/SPEC.md` `FR-6`, `FR-7`, `FR-9` e `FR-10`.
- Reutilizar Benefícios, Férias, Produtos e o contrato público da plataforma já aprovados.
- Holerite legado deve permanecer fora de `apps/`, do workspace pnpm e do grafo Nx, sem depender do shell, do contrato da plataforma ou do Design System.
- A coleção local de manifestos deve ser apenas uma fixture determinística de descoberta, sem perfis, elegibilidade, feature flags, percentuais ou canais de release.
- A validação deve incluir contratos, isolamento e um fluxo reproduzível entre shell, Benefícios, Férias e Holerite legado.

## Assumptions

- Holerite legado usa somente dados sintéticos.
- Em produção, o Journey Registry aplicaria autorização ou consumiria decisões externas antes de responder ao shell.

## Edge Cases

- Acesso direto ou refresh na rota externa registrada.
- Origem externa fora da allowlist.
- Manifesto ou rota de retorno inválidos.
- Destino legado indisponível durante a transição.

## Out of Scope

- Journey Registry remoto, SSO real, CI/CD, deploy e rollout em produção.
- Candidate, stable, percentuais, grupos piloto, promoção, rollback ou feature flags simulados.
- `native-route`, bridge móvel e fornecedores de observabilidade.

## Open Questions

Nenhuma.
