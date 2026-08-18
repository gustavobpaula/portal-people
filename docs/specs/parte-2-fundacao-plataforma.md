# Feature Specification: Parte 2 — Fundação da Plataforma

## Goal

Entregar a fundação executável do frontend moderno, provando composição federada em runtime, contratos mínimos, independência de build e fronteiras para squads antes da implementação das jornadas do portal.

## Functional Requirements

- **FR-1:** O workspace deve usar Nx e pnpm para organizar aplicações, bibliotecas e verificações afetadas.
- **FR-2:** Um host demonstrativo deve carregar um remote neutro React em runtime por Module Federation e manifesto validado.
- **FR-3:** Host e remote devem possuir comandos de desenvolvimento e build independentes.
- **FR-4:** O contrato `JourneyManifest` deve representar `federated-module`, `external-web` e `native-route`, com identidade, rota, versão, compatibilidade, owner, observabilidade e destino específico da estratégia, sem regras de audiência ou operação de releases.
- **FR-5:** O contrato `PlatformCapabilities` deve limitar a integração a navegação, contexto mínimo, telemetria, flags resolvidas, notificações e capacidades de dispositivo.
- **FR-6:** Fronteiras automatizadas devem impedir imports entre domínios, do shell para internals de domínio e de domínio para internals do shell.
- **FR-7:** O repositório deve oferecer um golden path inicial para criar novos domínios sem editar configurações internas do shell.
- **FR-8:** Somente React, React DOM e React Router podem compartilhar identidade como singletons de runtime.

## Acceptance Criteria

- **AC-1 [FR-1]:** O grafo Nx reconhece host, remote, contratos, tokens, Design System e documentação de componentes como projetos distintos.
- **AC-2 [FR-2, FR-5]:** O host resolve um manifesto válido, carrega o módulo exposto e fornece apenas `PlatformCapabilities`.
- **AC-3 [FR-2, FR-4]:** Manifesto inválido, incompatível ou remote indisponível resulta em fallback controlado sem desmontar o host.
- **AC-4 [FR-3]:** Host e remote geram artefatos separados sem depender do build um do outro.
- **AC-5 [FR-4, FR-5]:** Schemas e testes rejeitam estratégia, versão, rota ou capability inválida, não expõem tokens ou estado de negócio e não contêm audiência, percentual ou canal de release.
- **AC-6 [FR-6]:** O lint falha diante de imports proibidos e aceita apenas APIs públicas autorizadas.
- **AC-7 [FR-7]:** O comando documentado do golden path valida o nome e materializa um domínio a partir de template controlado.
- **AC-8 [FR-8]:** A configuração de federação declara somente os três singletons permitidos.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-1–AD-5, AD-12–AD-15, AD-18 e AD-22–AD-30.
- O remote deste incremento é uma prova neutra, não uma jornada de negócio.
- A validação deve usar TypeScript, Vitest e uma verificação de integração reproduzível.

## Assumptions

- O manifesto é local, determinístico e representa um destino já resolvido neste marco.
- O golden path inicial pode ser um gerador local versionado no workspace.

## Edge Cases

- Manifesto malformado ou contrato incompatível.
- Falha de rede ou de avaliação do módulo remoto.
- Capability opcional indisponível.

## Out of Scope

- Shell funcional, Benefícios, Férias, backend, Journey Registry remoto, seleção de audiência, rollout operacional e deploy.

## Open Questions

Nenhuma.
