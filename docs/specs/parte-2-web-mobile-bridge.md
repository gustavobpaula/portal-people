# Feature Specification: Parte 2 — Web/Mobile e Bridge

## Goal

Demonstrar que a mesma aplicação React responsiva atende navegador desktop, navegador mobile e uma WebView simulada, usando adapters de plataforma e uma bridge mínima para abrir uma jornada `native-route` sem expor APIs nativas, credenciais ou regras de negócio ao código web.

## Functional Requirements

- **FR-1:** Shell, experiências transversais, Benefícios, Férias e os estados de integração com o legado devem permanecer utilizáveis em viewports desktop e mobile, reutilizando somente APIs públicas do Design System.
- **FR-2:** O contrato público da plataforma deve oferecer adapters para navegador e WebView simulada, preservando a mesma interface para shell e jornadas e identificando corretamente a plataforma como `web` ou `webview`.
- **FR-3:** O adapter web deve declarar indisponíveis as capacidades exclusivamente nativas e apresentar fallback controlado quando uma entrada `native-route` for ativada.
- **FR-4:** A bridge simulada deve negociar versão e capacidades e aceitar somente comandos tipados, assíncronos e permitidos, com validação de origem e payload, timeout e resposta padronizada de sucesso ou falha.
- **FR-5:** O registro local deve conter uma única entrada sintética `native-route`, já resolvida e visível em Produtos. Sua ativação em WebView simulada deve encaminhar somente o destino nativo registrado, sem decisões de audiência, release ou negócio no shell.
- **FR-6:** Ativação, sucesso, indisponibilidade, rejeição, timeout e fallback de uma rota nativa devem emitir eventos sanitizados com domínio, versão, rota, plataforma e correlação quando disponíveis.
- **FR-7:** Falha, incompatibilidade ou ausência da bridge não deve desmontar o shell, alterar as demais jornadas ou permitir acesso direto a APIs do navegador ou do host nativo.

## Acceptance Criteria

- **AC-1 [FR-1]:** Testes em viewport desktop e mobile demonstram navegação e uso dos fluxos críticos de Home, Produtos, busca, notificações, Benefícios, Férias e retorno do legado sem perda de conteúdo ou ações essenciais.
- **AC-2 [FR-2]:** A mesma composição React opera nos modos `web` e `webview`, sem árvore de interface ou implementação de jornada duplicada por plataforma.
- **AC-3 [FR-3, FR-5]:** A entrada sintética aparece em Produtos; no modo WebView sua ativação envia à bridge somente o destino registrado, enquanto no navegador apresenta estado controlado de indisponibilidade.
- **AC-4 [FR-4]:** Versão ou capability incompatível, origem ou payload inválido e timeout produzem respostas distintas e verificáveis, sem executar o comando solicitado.
- **AC-5 [FR-4, FR-7]:** Shell e jornadas acessam recursos móveis somente pelo contrato público; testes ou regras de fronteira detectam acesso direto à bridge ou a objetos internos do host.
- **AC-6 [FR-6]:** Testes verificam os eventos da integração e confirmam que comandos, respostas e telemetria não contêm tokens, matrícula, dados pessoais ou objetos de negócio.
- **AC-7 [FR-7]:** Após falha ou indisponibilidade da bridge, navegação, jornadas modernas e retorno seguro permanecem operantes.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-9, AD-10, AD-17, AD-23, AD-24 e AD-26.
- Cobrir `docs/SPEC.md` `FR-8`, `FR-9` e `FR-10`.
- Reutilizar os contratos aprovados em `docs/specs/parte-2-fundacao-plataforma.md` e o shell aprovado em `docs/specs/parte-2-shell-plataforma.md`.
- A bridge, a WebView e a entrada nativa devem ser simulações locais e determinísticas.
- A validação deve incluir testes de contrato, componente e fluxos críticos em desktop, viewport mobile, navegador e WebView simulada.

## Assumptions

- Uma entrada nativa sintética, sem regra de negócio, é suficiente para provar a estratégia `native-route`.
- A simulação fornece uma origem autorizada fixa e não estabelece sessão real.

## Edge Cases

- Acesso direto à rota web de uma entrada nativa no navegador.
- Bridge ausente, versão antiga ou capability indisponível.
- Origem ou payload inválido, timeout e resposta recebida após o timeout.

## Out of Scope

- Aplicativos Kotlin ou Swift, WebView real e publicação em lojas.
- Autenticação, sessão nativa, push, deep links e APIs reais de câmera, arquivos, compartilhamento, download, biometria ou armazenamento seguro.
- Fornecedores de telemetria, deploy e infraestrutura de produção.

## Open Questions

Nenhuma.
