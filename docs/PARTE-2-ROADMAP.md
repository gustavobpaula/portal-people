# Roadmap — Parte 2: Aplicação Prática

## Estratégia de entrega

A Parte 2 foi construída em incrementos verticais. A aplicação mínima do case está concluída com fundação executável, Design System, shell, experiências transversais, duas jornadas modernas independentes, convivência legada simulada, adaptação web/mobile, descoberta HTTP, observabilidade e gates reproduzíveis de entrega.

Todas as specs da Parte 2 listadas em `docs/SPEC.md` foram detalhadas, aprovadas, implementadas e verificadas. Infraestrutura corporativa e integrações reais permanecem fora do monorepo, conforme os limites documentados abaixo.

## Sequenciamento

| Fase | Incremento | Dependências | Evidência de conclusão | Status |
|---|---|---|---|---|
| 1 | Fundação da plataforma | Arquitetura aprovada | Host + remote neutro, contratos públicos, fronteiras automatizadas, golden path e builds independentes | Concluída |
| 2 | Design System | Fundação | Tokens semânticos, API pública, estados, testes, assets locais e Storybook estático independente | Concluída |
| 3 | Shell e contrato da plataforma | Fases 1–2 | Layout, navegação hierárquica, registro dinâmico, capabilities estáveis, loading, timeout, retry e fallback | Concluída |
| 4 | Experiências transversais | Fase 3 | Home, Produtos, busca com estado na URL e notificações com estado de sessão sobre Portal BFF simulado | Concluída |
| 5 | Jornada Benefícios | Fases 2–3 | Remote consultivo independente, lista, detalhe, estados assíncronos, cache local ao domínio e telemetria sanitizada | Concluída |
| 6 | Jornada Férias | Fases 2–3 | Remote transacional independente, elegibilidade, validação, revisão, envio simulado e confirmação | Concluída |
| 7 | Legado, rollout e resiliência | Fases 3–6 | Holerite externo, retorno e isolamento; responsabilidades externas de rollout documentadas | Concluída |
| 8 | Web/mobile e bridge | Fases 3–7 | Fluxos desktop/mobile, adapters web e WebView, bridge simulada validada e jornada `native-route` | Concluída |
| 9 | Journey Registry demonstrativo | Fases 3–8 | Aplicação server-side independente, manifestos mantidos pelas squads, catálogo por HTTP, fallback seguro e recuperação | Concluída |
| 10 | Observabilidade e operação | Instrumentação evolui desde a fase 1 | Correlação W3C ponta a ponta, logs, erros, métricas, analytics sanitizados, Web Vitals e ownership | Concluída |
| 11 | Qualidade e entrega | Todas | Gate completo, validação de afetados, testes, builds, Storybook, acessibilidade, budgets, README e demonstração reproduzível | Concluída |

## Specs aprovadas e entregues

- [Fundação da Plataforma](specs/parte-2-fundacao-plataforma.md)
- [Design System](specs/parte-2-design-system.md)
- [Shell e Contrato da Plataforma](specs/parte-2-shell-plataforma.md)
- [Experiências Transversais](specs/parte-2-experiencias-transversais.md)
- [Jornada Benefícios](specs/parte-2-beneficios.md)
- [Jornada Férias](specs/parte-2-ferias.md)
- [Legado, Rollout e Resiliência](specs/parte-2-legado-rollout-resiliencia.md)
- [Web/Mobile e Bridge](specs/parte-2-web-mobile-bridge.md)
- [Journey Registry Demonstrativo](specs/parte-2-journey-registry.md)
- [Observabilidade e Operação](specs/parte-2-observabilidade-operacao.md)
- [Qualidade e Entrega](specs/parte-2-qualidade-entrega.md)

Esses documentos constituem o escopo aprovado da Parte 2 e permanecem ligados no catálogo canônico `docs/SPEC.md`.

## Rastreabilidade

| Tema aprovado | Origem | Fases responsáveis |
|---|---|---|
| Shell, catálogo e carregamento | `docs/CASE.md`, Parte 2.1; `docs/ARCHITECTURE.md`, AD-1 e AD-26 | 1, 3, 4 e 9 |
| Duas jornadas e squads distintas | `docs/CASE.md`, Parte 2.2; AD-5, AD-13 e AD-14 | 5 e 6 |
| Inclusão sem alterar o core | `docs/CASE.md`, requisitos funcionais; AD-3, AD-4 e AD-23 | 1, 3 e 9 |
| Module Federation, monorepo e governança | `docs/PROPOSTA-TECNICA.md`, seções 3–4; AD-4, AD-12 e AD-15 | 1, 3, 9 e 11 |
| Design System web/mobile | `docs/PROPOSTA-TECNICA.md`, seção 5; AD-11, AD-29 e AD-31 | 2 e 8 |
| Home, busca e notificações | `docs/CASE.md`, requisitos funcionais; AD-7 | 4 |
| Journey Registry e catálogo resolvido | `docs/ARCHITECTURE.md`, AD-3, AD-7, AD-8 e AD-21 | 9 |
| Legado e migração incremental | `docs/PROPOSTA-TECNICA.md`, seção 6; AD-19–AD-21; rollout operado externamente por CI/CD e deployment | 7 |
| Mobile mínimo e bridge | `docs/PROPOSTA-TECNICA.md`, seção 2; AD-9, AD-10 e AD-24 | 8 |
| Observabilidade e isolamento | `docs/PROPOSTA-TECNICA.md`, Observabilidade; AD-17 e AD-18 | 1, 3, 7, 9 e 10 |
| Estado, dados e testes | AD-22, AD-27, AD-28 e AD-30 | Todas as fases aplicáveis |

## Validação da entrega

O comando `corepack pnpm quality` executa lint, tipos, testes, builds independentes, Storybook estático e as verificações integradas de federação, shell, Journey Registry, legado, web/mobile, observabilidade, acessibilidade e performance. O gate completo da implementação atual encerra sem erro.

O JavaScript inicial do shell permanece na faixa de alerta do budget, abaixo do limite bloqueante. O relatório detalhado é gerado em `dist/quality/performance-budgets.json`.

## Limites da entrega concluída

Permanecem intencionalmente fora do monorepo:

- publicação e infraestrutura de produção;
- CI/CD, repositório corporativo de releases, Canary, Blue-Green, promoção, rollout e rollback reais;
- Journey Registry corporativo, feature flags, autenticação, autorização e segmentação reais;
- Portal BFF, BFFs de domínio e APIs corporativas reais;
- aplicativos Kotlin/Swift, WebView nativa e bridge nativa de produção;
- SSO, fornecedores de observabilidade, dashboards, alertas e SLOs de produção;
- migração ou desativação de sistemas legados reais.

O monorepo usa simulações locais e dados sintéticos para demonstrar os contratos e comportamentos exigidos pelo case sem reimplementar essas responsabilidades externas.
