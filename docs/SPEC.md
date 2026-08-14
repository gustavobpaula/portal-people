# Especificação — Parte 1: Proposta Técnica

## Objetivo

Definir uma proposta técnica completa para a próxima geração do Portal Pessoas, capaz de sustentar mais de 10 squads, experiências web e mobile, integração incremental com o legado e evolução independente por domínio.

A entrega desta etapa é documental e deve responder integralmente aos seis tópicos da Parte 1 do case, apresentar os respectivos trade-offs e incluir os diagramas necessários. A aplicação prática pertence a uma etapa posterior.

## Requisitos Funcionais

- **FR-1:** A proposta deve apresentar um diagrama de alto nível contendo shell, microfrontends ou alternativa escolhida, aplicativo mobile, BFF, APIs, Design System, observabilidade e integração com jornadas legadas.
- **FR-5:** A proposta deve definir um contrato de integração que permita adicionar novos domínios ou jornadas sem transferir responsabilidades de negócio para o shell.
- **FR-6:** A proposta deve definir como jornadas modernas e legadas convivem e como o usuário é direcionado com segurança para experiências ainda não modernizadas.
- **FR-8:** A proposta deve definir publicação, deploy independente quando aplicável, versionamento, governança, padrões mínimos de qualidade e observabilidade.
- **FR-9:** A arquitetura deve sustentar mais de 10 squads trabalhando simultaneamente por domínio ou jornada, com baixa dependência entre equipes e sem transformar o shell ou a squad de plataforma em gargalo.
- **FR-10:** A estratégia web/mobile deve definir responsabilidades da camada nativa, elementos compartilháveis, redução de duplicação, consistência visual e funcional, tecnologia adotada e trade-offs.
- **FR-11:** A estratégia organizacional deve explicar trabalho paralelo, publicação, prevenção de conflitos, versionamento, governança, qualidade e evolução sem dependência recorrente do shell.
- **FR-12:** A proposta deve declarar se utilizará microfrontends ou alternativa e justificar o mecanismo escolhido. Module Federation, Web Components, Single-SPA, pacotes versionados, monorepo, polyrepo e modelos híbridos devem ser avaliados quando aplicáveis.
- **FR-13:** O Design System deve ser estruturado em tokens, componentes base, componentes compostos e componentes específicos de negócio, com ownership, versionamento, governança, adoção e compatibilidade entre web e mobile.
- **FR-14:** A estratégia de migração deve explicar convivência com o legado, evolução sem big bang, redirecionamento, rollout, medição do avanço e proteção da experiência do colaborador.
- **FR-15:** A estratégia de observabilidade deve contemplar logs, métricas, monitoramento de erros, analytics de navegação e correlação suficiente para identificar domínio, versão e etapa da jornada afetada.

## Critérios de Aceitação

- **AC-1 [FR-1]:** O diagrama identifica todos os elementos obrigatórios e explicita suas relações e principais fluxos.
- **AC-6 [FR-5]:** O contrato de extensão define o que um domínio fornece ao portal e o que não pode exigir do shell.
- **AC-7 [FR-6]:** A integração com o legado define entrada, retorno, falha controlada e continuidade de contexto.
- **AC-9 [FR-8]:** Publicação, versionamento, governança, gates de qualidade e responsabilidade operacional estão documentados.
- **AC-10 [FR-9]:** A proposta demonstra como squads mantêm ownership e cadência independentes sem dependências transversais excessivas.
- **AC-11 [FR-10]:** Responsabilidades nativas e web, compartilhamento, consistência, comunicação entre camadas e alternativas rejeitadas estão documentados com trade-offs.
- **AC-12 [FR-11]:** O fluxo operacional cobre desenvolvimento, integração, publicação, rollback, compatibilidade de versões, mudanças transversais e prevenção de conflitos.
- **AC-13 [FR-12]:** A composição escolhida é comparada com alternativas em autonomia, complexidade operacional, performance, governança, reuso e evolução futura.
- **AC-14 [FR-13]:** Camadas, ownership, contribuição, distribuição, versionamento e compatibilidade multiplataforma do Design System estão definidos.
- **AC-15 [FR-14]:** A migração possui fases, direcionamento, rollout, rollback, indicadores de progresso e guardrails de experiência.
- **AC-16 [FR-15]:** A proposta define sinais, contexto de correlação, ownership de alertas e isolamento de falhas por domínio.
- **AC-17 [FR-1, FR-10–FR-15]:** Todas as perguntas obrigatórias da Parte 1 estão respondidas no documento de arquitetura; nenhuma permanece como decisão adiada.

## Restrições

- React e TypeScript são a base das experiências web modernas.
- Autonomia sustentável para mais de 10 squads é prioridade arquitetural.
- A proposta deve ser compatível com um core mobile nativo Kotlin/Swift e experiências React integráveis por WebView.
- A arquitetura deve permitir evolução incremental e convivência temporária com legado.
- A Parte 1 não inclui código, infraestrutura ou execução de deploy.
- Arquitetura e diagramas devem ser aprovados antes do planejamento da Parte 2.

## Premissas

- O ecossistema mobile existente combina capacidades nativas e experiências web.
- Consistência entre plataformas significa linguagem visual e comportamento coerentes, não implementações idênticas.
- Deploy independente é uma capacidade arquitetural a ser analisada, não algo que será executado nesta etapa.
- Domínio ou jornada representa uma fronteira genérica de produto e ownership; nenhuma jornada funcional específica está selecionada nesta etapa.

## Casos Limítrofes

- A indisponibilidade de um domínio não deve inutilizar o shell ou outros domínios.
- Incompatibilidade de contrato ou versão deve produzir fallback controlado.
- Uma jornada legada indisponível deve preservar retorno seguro ao portal.
- Mudanças transversais devem possuir estratégia de compatibilidade que evite migração simultânea de todas as squads.

## Fora de Escopo

- Escolher ou implementar jornadas funcionais específicas.
- Desenvolver shell, microfrontends, aplicativo mobile ou BFF.
- Criar mocks, testes de aplicação, pipeline ou infraestrutura.
- Executar deploy ou migração real.
- Planejar a Parte 2 antes da aprovação da arquitetura.

## Questões a Resolver na Arquitetura

Todas as questões abaixo são obrigatórias e não poderão permanecer abertas na entrega final:

- Limites e responsabilidades do shell.
- Monorepo, polyrepo ou modelo híbrido.
- Microfrontends ou alternativa e mecanismo de composição.
- Granularidade, descoberta e carregamento dos domínios.
- Responsabilidades do core nativo, WebView e bridge.
- Compartilhamento e versionamento do Design System.
- Topologia de BFFs, APIs e contratos.
- Estado e comunicação entre shell e domínios.
- Observabilidade e isolamento de falhas.
- Publicação, versionamento, rollout e rollback.
- Governança para mais de 10 squads.
- Fases e indicadores da migração do legado.
