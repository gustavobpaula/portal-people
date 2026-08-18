# Specification

## Goal

Conduzir a modernização do Portal Pessoas em incrementos demonstráveis: preservar a proposta técnica aprovada e implementar uma aplicação pequena que prove composição independente, reuso, evolução por squads e convivência controlada com o legado.

## Functional Requirements

- **FR-1:** A Parte 1 deve permanecer rastreável como a proposta técnica aprovada do case.
- **FR-2:** A Parte 2 deve possuir uma fundação executável com shell, contratos de plataforma, carregamento federado em runtime e builds independentes.
- **FR-3:** A aplicação concluída deve possuir ao menos duas jornadas modernas mantidas como domínios independentes.
- **FR-4:** Uma nova jornada deve poder ser descoberta por manifesto sem import de sua implementação pelo shell.
- **FR-5:** Shell e jornadas devem reutilizar tokens e componentes públicos de um Design System demonstrativo.
- **FR-6:** A aplicação concluída deve demonstrar home, catálogo, busca, notificações e uma jornada externa simulada.
- **FR-7:** Falhas de manifesto ou carregamento de uma jornada não devem inutilizar o shell.
- **FR-8:** A experiência deve ser responsiva e compatível com uma bridge móvel simulada, sem exigir aplicativos nativos no case.
- **FR-9:** Logs, erros, métricas de experiência e analytics devem possuir contexto mínimo de domínio, versão, rota, plataforma e correlação.
- **FR-10:** Instalação, execução, testes e builds devem ser reproduzíveis localmente.

## Acceptance Criteria

- **AC-1 [FR-1]:** A spec da Parte 1 preserva conteúdo e identificadores e permanece ligada neste catálogo.
- **AC-2 [FR-2, FR-4]:** Um host carrega um remote neutro em runtime por contrato validado, e ambos produzem builds separados.
- **AC-3 [FR-3]:** Benefícios e Férias são entregues como remotes sem imports entre si.
- **AC-4 [FR-5]:** Tokens e componentes são consumidos somente pela API pública do Design System e documentados em Storybook independente.
- **AC-5 [FR-6]:** As experiências transversais e o destino externo são navegáveis com dados simulados.
- **AC-6 [FR-7]:** Manifesto inválido, versão incompatível e indisponibilidade exibem fallback controlado.
- **AC-7 [FR-8]:** Fluxos críticos funcionam em desktop e viewport mobile e exercitam o adapter web da bridge.
- **AC-8 [FR-9]:** Eventos demonstrativos propagam contexto e não registram tokens ou dados pessoais.
- **AC-9 [FR-10]:** Os comandos documentados de lint, tipos, testes, builds e Storybook executam sem erro.

## Constraints

- A baseline e as fronteiras de `docs/ARCHITECTURE.md` são obrigatórias.
- O desenvolvimento é incremental; somente specs aprovadas e ligadas abaixo constituem escopo ativo.
- APIs, BFFs, mobile nativo e jornadas externas podem usar simulações locais quando necessários à experiência demonstrável.
- CI/CD, publicação de releases, Journey Registry corporativo, feature flags, Canary, Blue-Green, promoção, rollout, rollback e infraestrutura de produção são responsabilidades externas documentadas, não reimplementadas no monorepo.
- A referência pública do Itaú orienta a linguagem visual, mas não fornece código ou ativos ao projeto.

## Assumptions

- Benefícios e Férias serão as duas jornadas modernas.
- O primeiro marco implementa apenas fundação e Design System e não conclui a Parte 2.

## Edge Cases

- Um remote ausente ou incompatível preserva navegação e conteúdo do host.
- Um consumidor não pode acessar internals de plataforma, Design System ou outro domínio.

## Out of Scope

- Publicação em produção, backend real e aplicativos Kotlin ou Swift.
- Implementação antecipada das specs futuras registradas somente no roadmap.

## Open Questions

Nenhuma para o primeiro marco.

## Feature Specifications

- [Parte 1 — Proposta Técnica](specs/parte-1-proposta-tecnica.md)
- [Parte 2 — Fundação da Plataforma](specs/parte-2-fundacao-plataforma.md)
- [Parte 2 — Design System](specs/parte-2-design-system.md)
- [Parte 2 — Shell e Contrato da Plataforma](specs/parte-2-shell-plataforma.md)
- [Parte 2 — Experiências Transversais](specs/parte-2-experiencias-transversais.md)
- [Parte 2 — Jornada Benefícios](specs/parte-2-beneficios.md)
- [Parte 2 — Jornada Férias](specs/parte-2-ferias.md)
- [Parte 2 — Legado, Rollout e Resiliência](specs/parte-2-legado-rollout-resiliencia.md)

## Delivery Roadmap

O sequenciamento completo e as specs futuras ainda não aprovadas estão em [PARTE-2-ROADMAP.md](PARTE-2-ROADMAP.md).
