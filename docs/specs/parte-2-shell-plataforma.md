# Feature Specification: Parte 2 — Shell e Contrato da Plataforma

## Goal

Evoluir o host demonstrativo para um shell navegável que componha jornadas registradas dinamicamente, forneça o contrato público da plataforma e preserve layout e navegação diante de falhas isoladas.

## Functional Requirements

- **FR-1:** O shell deve oferecer layout base com cabeçalho, área principal e ações transversais aprovadas, reutilizando somente APIs públicas do Design System para elementos compartilhados e sem incorporar regras ou estado de negócio.
- **FR-2:** O shell deve resolver uma coleção de manifestos e derivar dela as rotas principais, sem importar implementações de domínio nem exigir alteração da configuração interna para cada nova jornada. A descoberta listada das jornadas ocorre por Produtos, conforme `docs/specs/parte-2-experiencias-transversais.md`.
- **FR-3:** Entradas inválidas ou incompatíveis devem ser isoladas, preservando as entradas válidas e a navegação do shell.
- **FR-4:** O roteamento deve ser hierárquico: o shell controla a rota principal da jornada, enquanto o remote controla suas rotas relativas. Acesso direto ou refresh em uma rota registrada deve restaurar a composição correspondente.
- **FR-5:** Jornadas `federated-module` devem ser carregadas sob demanda com estado de loading, timeout, fronteira de erro, fallback controlado, retorno seguro e ação manual de nova tentativa, sem repetição automática ilimitada.
- **FR-6:** O shell deve fornecer a cada remote uma instância estável de `PlatformCapabilities`, mantendo a API aprovada de navegação, contexto, telemetria, flags, notificações e dispositivo, sem expor tokens, estado de negócio ou internals do navegador.
- **FR-7:** Resolução, início de carregamento, sucesso, fallback e nova tentativa devem emitir eventos sanitizados com domínio, versão, rota, plataforma e correlação quando esses dados estiverem disponíveis.
- **FR-8:** O golden path deve passar a gerar um esqueleto federado com configuração Vite, Module Federation, manifesto e verificação de composição, sem editar o shell.

## Acceptance Criteria

- **AC-1 [FR-1]:** O shell apresenta landmarks de cabeçalho e conteúdo principal, oferece ações aprovadas com operação por teclado e não lista jornadas no cabeçalho.
- **AC-2 [FR-2]:** Adicionar uma entrada válida ao registro local torna a jornada neutra acessível por Produtos e navegável sem import de sua implementação ou edição de uma tabela interna de rotas do shell.
- **AC-3 [FR-3]:** Uma coleção contendo entradas válidas e inválidas mantém disponíveis as entradas válidas e não desmonta o shell.
- **AC-4 [FR-4]:** Navegação direta e refresh em uma rota registrada carregam a jornada correta, e uma rota relativa permanece sob controle do remote.
- **AC-5 [FR-5]:** Loading, incompatibilidade, timeout e erro de renderização apresentam estados observáveis; a ação de tentar novamente repete somente o carregamento selecionado.
- **AC-6 [FR-6]:** O remote recebe a mesma instância de capabilities durante seu ciclo montado e consegue navegar pelo contrato sem acessar estado interno do shell.
- **AC-7 [FR-7]:** Testes verificam os eventos de carregamento e falha e confirmam a ausência de tokens ou dados pessoais nos payloads.
- **AC-8 [FR-8]:** O comando documentado do golden path gera e valida um novo remote federado sem modificar arquivos do shell.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-1, AD-3–AD-5, AD-17, AD-18, AD-23, AD-25 e AD-26.
- Reutilizar os contratos aprovados em `docs/specs/parte-2-fundacao-plataforma.md` e a API pública aprovada em `docs/specs/parte-2-design-system.md`.
- O registro e os destinos permanecem locais e determinísticos neste incremento.
- A validação deve incluir testes de componente e uma verificação de composição federada reproduzível.

## Assumptions

- O remote neutro representa a única jornada necessária para provar o shell nesta fase.
- A coleção local de manifestos simula o futuro registro remoto.

## Edge Cases

- Uma entrada inválida coexistindo com uma jornada válida.
- Acesso inicial por URL diretamente em uma rota registrada.
- Timeout, indisponibilidade ou erro de renderização do remote.

## Out of Scope

- Implementação de home, Produtos, busca, conteúdo e dados de notificações, definidos em `docs/specs/parte-2-experiencias-transversais.md`.
- Jornadas Benefícios e Férias.
- Execução de `external-web` e `native-route`, rollout, rollback, bridge nativa e registry remoto.
- Fornecedores de observabilidade, deploy e infraestrutura.

## Open Questions

Nenhuma.
