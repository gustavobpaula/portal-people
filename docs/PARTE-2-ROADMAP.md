# Roadmap — Parte 2: Aplicação Prática

## Estratégia de entrega

A Parte 2 será construída em incrementos verticais. O primeiro marco entrega somente fundação e Design System; a aplicação mínima do case será considerada concluída após shell, duas jornadas modernas e convivência legada simulada.

Specs futuras permanecem sem link no catálogo até serem detalhadas e aprovadas.

## Sequenciamento

| Fase | Incremento | Dependências | Evidência de conclusão | Status |
|---|---|---|---|---|
| 1 | Fundação da plataforma | Arquitetura aprovada | Host + remote neutro, contratos, fronteiras e builds independentes | Spec aprovada; implementação pendente |
| 2 | Design System | Fundação | Tokens, API pública, testes e Storybook estático | Spec aprovada; implementação pendente |
| 3 | Shell e contrato da plataforma | Fases 1–2 | Layout, navegação, registro dinâmico, loading e fallback | Planejada |
| 4 | Experiências transversais | Fase 3 | Home, catálogo, busca e notificações com Portal BFF simulado | Planejada |
| 5 | Jornada Benefícios | Fases 2–3 | Remote consultivo independente e estados de dados | Planejada |
| 6 | Jornada Férias | Fases 2–3 | Remote transacional independente, validação e confirmação | Planejada |
| 7 | Legado, rollout e resiliência | Fases 3–6 | Holerite externo, retorno e isolamento; responsabilidades externas de rollout documentadas | Concluída |
| 8 | Web/mobile e bridge | Fases 3–7 | Responsividade, adapter web, bridge simulada e `native-route` | Concluída |
| 9 | Journey Registry demonstrativo | Fases 3–8 | Aplicação server-side independente, catálogo por HTTP e fallback seguro | Concluída |
| 10 | Observabilidade e operação | Instrumentação evolui desde a fase 1 | Correlação ponta a ponta, sinais sanitizados e ownership | Concluída |
| 11 | Qualidade e entrega | Todas | Gates, budgets, README e demonstração reproduzível | Planejada |

## Specs futuras previstas

- `parte-2-shell-plataforma.md`
- `parte-2-experiencias-transversais.md`
- `parte-2-beneficios.md`
- `parte-2-ferias.md`
- `parte-2-legado-rollout-resiliencia.md`
- `parte-2-observabilidade-operacao.md`

Os nomes acima reservam intenção no roadmap, mas os arquivos não serão criados nem tratados como requisitos aprovados antes do refinamento.

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

## Limites do primeiro marco

Não serão implementados ainda: shell funcional, jornadas Benefícios e Férias, BFFs, registry remoto, destino legado, bridge nativa, fornecedores de telemetria, deploy ou infraestrutura. O remote neutro existe apenas para provar os riscos técnicos da composição.
