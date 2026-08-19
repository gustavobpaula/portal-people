# Feature Specification: Parte 2 — Qualidade e Entrega

## Goal

Consolidar a qualidade e a entrega demonstrável do Portal Pessoas com gates reproduzíveis, budgets de performance, documentação operacional e uma execução integrada verificável, sem implementar a infraestrutura externa de CI/CD ou deployment.

## Functional Requirements

- **FR-1:** Um gate final documentado deve executar lint, tipos, testes orientados a risco, verificações especializadas existentes, builds independentes e build estático do Storybook. Qualquer falha obrigatória deve encerrar o comando com código diferente de zero.
- **FR-2:** O workspace deve oferecer um gate para mudanças rotineiras baseado em projetos afetados e dependentes do Nx. Alterações em contratos, configurações compartilhadas, manifests, generators ou regras de fronteira devem selecionar também as verificações transversais correspondentes.
- **FR-3:** Builds de produção devem respeitar os seguintes budgets de transferência:

  | Caminho crítico | Alerta | Bloqueio |
  |---|---:|---:|
  | JavaScript inicial do shell, gzip | 180 KiB | 200 KiB |
  | JavaScript adicional de cada remote, gzip | 90 KiB | 100 KiB |
  | Recursos totais do carregamento inicial | 315 KiB | 350 KiB |
  | CSS crítico por rota, gzip | 30 KiB | 35 KiB |

- **FR-4:** A verificação de budgets deve medir os recursos necessários para renderizar a rota sobre artefatos de produção. O shell deve ser medido com cache vazio; cada remote, como carga incremental após o shell, excluindo apenas singletons já carregados. Divisão ou renomeação de chunks não pode reduzir artificialmente o total. LCP, INP e CLS devem continuar registrados e demonstráveis, com referências de 2,5 s, 200 ms e 0,1, respectivamente, sem gate local bloqueante.
- **FR-5:** Os gates devem cobrir contratos, manifests, fronteiras Nx, golden path, isolamento de falhas e acessibilidade dos fluxos críticos em desktop e viewport mobile. Percentual isolado de cobertura não deve substituir testes orientados a risco.
- **FR-6:** O README deve documentar pré-requisitos, instalação, mapa das aplicações e owners, comandos completos e afetados, budgets, arquitetura da demonstração, execução integrada, resultados esperados, falhas simuláveis e responsabilidades externas.
- **FR-7:** Um único comando documentado deve iniciar localmente Journey Registry, shell, remotes e destino legado necessários para demonstrar Home, Produtos, busca, notificações, Benefícios, Férias, legado e comportamento web/WebView, sem credenciais ou serviços corporativos.
- **FR-8:** A etapa deve registrar a reavaliação de `docs/ARCHITECTURE.md` `DD-1`. Um generator de serviços/BFFs somente poderá entrar no escopo se houver outro serviço frontend-owned com convenções concretamente repetidas.

## Acceptance Criteria

- **AC-1 [FR-1]:** Após a instalação documentada com lockfile, o gate final executa todas as verificações e builds obrigatórios sem erro; uma falha provoca saída diferente de zero.
- **AC-2 [FR-2]:** Mudanças representativas em domínio e contrato compartilhado selecionam, respectivamente, o projeto alterado e os dependentes ou verificações transversais esperados.
- **AC-3 [FR-3, FR-4]:** Um relatório identifica rota, categoria, recursos, total gzip e resultado; exceder alerta é visível e exceder bloqueio falha o gate.
- **AC-4 [FR-4]:** A demonstração emite LCP, INP e CLS, mas variações locais dessas métricas não bloqueiam a entrega.
- **AC-5 [FR-5]:** Violações intencionais e controladas de contrato, manifesto, fronteira, budget ou acessibilidade são detectadas pelo gate responsável.
- **AC-6 [FR-6]:** Uma pessoa seguindo apenas o README consegue instalar, validar, iniciar e encerrar a demonstração e identificar os limites entre monorepo, CI/CD e deployment.
- **AC-7 [FR-7]:** O comando integrado disponibiliza todos os fluxos listados, e a indisponibilidade isolada de Registry, remote ou legado preserva as experiências não afetadas.
- **AC-8 [FR-8]:** A entrega registra se o gatilho de `DD-1` ocorreu e mantém a decisão adiada quando não houver repetição comprovada.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-12, AD-15, AD-16, AD-18, AD-30 e DD-1.
- Cobrir `docs/SPEC.md` `FR-10` e `AC-9`.
- Budgets usam KiB de 1.024 bytes e transferência comprimida com gzip.
- CI/CD, publicação, deploy, promoção, rollout e rollback permanecem externos.
- O fluxo local não deve exigir credenciais, backend corporativo ou fornecedor de telemetria.

## Assumptions

- O Journey Registry permanece o único serviço server-side frontend-owned; o Portal BFF continua simulado.
- Chromium pode ser instalado ou fornecido conforme os pré-requisitos documentados.

## Edge Cases

- Uma mudança compartilhada afeta projetos que não foram editados diretamente.
- Novos chunks ou remotes registrados devem entrar automaticamente na medição.
- Falha ou interrupção da demonstração deve encerrar seus processos locais.

## Out of Scope

- Hospedar pipelines, publicar artefatos ou executar deploy e rollout.
- Definir meta percentual de cobertura.
- Tornar Core Web Vitals locais um gate bloqueante.

## Open Questions

Nenhuma.
