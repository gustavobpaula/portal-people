# Feature Specification: Parte 2 — Experiências Transversais

## Goal

Entregar uma home com busca e Produtos e uma rota de notificações como experiências transversais do Portal Pessoas, consumindo um Portal BFF simulado e permitindo acesso consistente às jornadas sem adicionar regras de domínio ao shell.

## Functional Requirements

- **FR-1:** A home deve apresentar busca de jornadas e funcionalidades e a seção Produtos. O cabeçalho deve oferecer uma ação acessível para abrir as notificações, reutilizando somente APIs públicas do Design System.
- **FR-2:** Produtos deve apresentar as jornadas e funcionalidades fornecidas pelo Portal BFF simulado, com informações suficientes para identificação e uma ação que navegue pelo roteamento controlado pelo shell. Produtos é o único acesso listado às jornadas.
- **FR-3:** A busca deve consultar exclusivamente Produtos e apresentar os resultados correspondentes sem carregar ou pesquisar conteúdo interno das jornadas.
- **FR-4:** A rota `/notificacoes` deve listar notificações lidas e não lidas e permitir marcar individualmente uma notificação como lida por ativação. Uma notificação não lida deve ter fundo cinza-claro e indicador circular azul. O estado de leitura deve permanecer somente durante a sessão do navegador.
- **FR-5:** Produtos, busca e notificações devem representar estados de loading, vazio e erro do Portal BFF simulado, oferecendo nova tentativa após falha recuperável sem inutilizar o shell ou as demais experiências.
- **FR-6:** O termo de busca submetido deve permanecer na URL, permitindo refresh e navegação de histórico sem perder o estado navegável da consulta.
- **FR-7:** Carregamento de Produtos e notificações, execução da busca, navegação por Produtos, abertura da rota de notificações e marcação de notificação como lida devem emitir eventos sanitizados com rota, plataforma e correlação, sem registrar o termo pesquisado, conteúdo de notificações, tokens ou dados pessoais.
- **FR-8:** Home, Produtos, busca e rota de notificações devem operar por teclado e em viewports desktop e mobile, com foco perceptível e comunicação acessível de resultados, loading e erros.

## Acceptance Criteria

- **AC-1 [FR-1]:** Ao acessar a home, o usuário encontra busca e Produtos. O cabeçalho oferece uma ação com nome acessível para abrir `/notificacoes` e não lista jornadas.
- **AC-2 [FR-2]:** Os itens retornados por Produtos são apresentados e suas ações navegam pelas rotas do shell sem importar implementações de domínio ou duplicar os itens no cabeçalho.
- **AC-3 [FR-3, FR-6]:** Uma busca submetida consulta somente Produtos, atualiza a URL e é restaurada com os mesmos resultados após refresh.
- **AC-4 [FR-3, FR-5]:** Uma consulta sem correspondências apresenta um estado vazio específico e permite limpar ou substituir o termo pesquisado.
- **AC-5 [FR-4]:** Acessar `/notificacoes` lista as notificações. Ativar uma notificação por clique, toque ou teclado a marca como lida, remove seu indicador visual de não lida e preserva esse estado após refresh na mesma sessão; uma nova sessão começa com o estado fornecido pelo BFF simulado.
- **AC-6 [FR-5]:** Respostas atrasadas, coleções vazias e falhas simuladas de Produtos, busca e notificações apresentam estados distintos, e a nova tentativa repete somente a operação que falhou.
- **AC-7 [FR-7]:** Testes verificam os eventos das interações, incluindo abertura da rota de notificações e leitura, e confirmam que seus payloads não contêm termos de busca, conteúdo de notificações, tokens ou dados pessoais.
- **AC-8 [FR-8]:** Home, Produtos, busca e notificações são utilizáveis por teclado em desktop e viewport mobile, e alterações assíncronas relevantes são anunciadas por tecnologia assistiva.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-1, AD-7, AD-17, AD-22–AD-24, AD-26 e AD-30.
- Reutilizar o shell e o contrato aprovados em `docs/specs/parte-2-shell-plataforma.md` e somente a API pública aprovada em `docs/specs/parte-2-design-system.md`.
- O Portal BFF deve ser uma simulação local, determinística e sem dependência de backend ou serviço externo.
- A persistência do estado de leitura deve armazenar somente identificadores opacos durante a sessão do navegador, sem conteúdo de notificações ou dados pessoais.
- A validação deve incluir testes de componentes e de integração com os contratos HTTP simulados.

## Assumptions

- Os dados simulados de Produtos são consistentes com as rotas disponíveis no registro local.
- A busca textual do case ignora diferenças entre letras maiúsculas e minúsculas e considera título, descrição e palavras-chave dos itens simulados.
- As notificações usam conteúdo sintético e não contêm dados pessoais.

## Edge Cases

- Produtos vazio.
- Busca sem resultados.
- Atraso ou falha do Portal BFF simulado.
- Identificador persistido que não existe mais na coleção de notificações.

## Out of Scope

- Backend real, sincronização do estado de leitura entre sessões ou dispositivos e notificações push.
- Badge de contagem, detalhe de notificação ou ação adicional ao marcar uma notificação como lida.
- Jornadas Benefícios e Férias.
- Execução de destinos `external-web` e `native-route`, bridge nativa, registry remoto, deploy e infraestrutura.

## Open Questions

Nenhuma.
