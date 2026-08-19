# Feature Specification: Parte 2 — Observabilidade e Operação

## Goal

Consolidar a observabilidade transversal do Portal Pessoas, demonstrando correlação ponta a ponta, sinais estruturados e sanitizados, isolamento de falhas e ownership operacional por plataforma, domínio e integração, sem acoplar a aplicação a um fornecedor de telemetria.

## Functional Requirements

- **FR-1:** O shell deve iniciar um contexto de correlação por carregamento do portal, mantê-lo estável nas capabilities fornecidas aos remotes e propagá-lo pelas integrações HTTP demonstrativas usando W3C Trace Context.
- **FR-2:** Shell, remotes e serviços da Plataforma Frontend devem emitir, por contratos desacoplados de fornecedor, logs estruturados, erros, métricas de performance e analytics de navegação. Os sinais devem identificar domínio, versão, rota, plataforma, correlação e etapa ou operação afetada.
- **FR-3:** A sanitização deve ocorrer antes de qualquer exportação ou registro. Nenhum sinal pode conter tokens, matrícula, salário, documentos, dados pessoais, termos de busca, conteúdo de notificações, dados de benefícios, valores de formulários, protocolos, manifestos ou destinos completos, comandos nativos ou respostas da bridge.
- **FR-4:** Erros de carregamento ou execução de remotes, Registry, integrações externas e bridge devem produzir sinais distintos sem derrubar o shell ou outros domínios. Falha no mecanismo de telemetria também não deve alterar o comportamento observável da aplicação.
- **FR-5:** A demonstração deve registrar Web Vitals e duração ou resultado das operações críticas de resolução do Registry, carregamento federado e consultas HTTP das jornadas, sem incluir payloads de negócio.
- **FR-6:** Cada namespace ou domínio observável deve possuir owner operacional identificável. Shell, Registry e runtime pertencem à Plataforma Frontend; remotes pertencem às squads declaradas nos manifestos; BFFs e APIs aos respectivos times backend; bridge e WebView aos times mobile. O mapeamento deve indicar responsabilidade por dashboards, alertas e incidentes.
- **FR-7:** A correlação, os tipos de sinal, a sanitização, o isolamento e o mapeamento de ownership devem possuir verificação automatizada e reproduzível localmente, sem exigir coletor ou serviço externo.

## Acceptance Criteria

- **AC-1 [FR-1]:** Um fluxo integrado envolvendo shell, Journey Registry, abertura de uma jornada e uma consulta HTTP preserva a mesma correlação nos sinais da experiência e envia um `traceparent` válido nas fronteiras HTTP exercitadas.
- **AC-2 [FR-2]:** A demonstração produz ao menos um log estruturado, um erro monitorado, uma métrica de performance e um analytics de navegação contendo o contexto comum obrigatório.
- **AC-3 [FR-3]:** Testes com valores proibidos confirmam que nenhum exporter, logger ou evento observável recebe esses valores.
- **AC-4 [FR-4]:** Falhas simuladas de remote, Registry, destino externo, bridge e exporter produzem sinais distintos enquanto shell e jornadas não afetadas permanecem utilizáveis.
- **AC-5 [FR-5]:** Web Vitals e timings das operações críticas podem ser inspecionados e contêm nome, resultado, duração quando aplicável e contexto comum, sem payload de negócio.
- **AC-6 [FR-6]:** Todas as jornadas registradas resolvem para namespace e owner válidos, e o inventário operacional diferencia as responsabilidades de Plataforma Frontend, squads de domínio, backend e mobile.
- **AC-7 [FR-7]:** Um comando documentado executa as verificações de observabilidade localmente sem credenciais, rede corporativa ou fornecedor de telemetria.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-17, AD-18, AD-23, AD-24 e AD-30.
- Cobrir `docs/SPEC.md` `FR-9`, `AC-8` e `FR-10`.
- Reutilizar o contrato público e os campos de observabilidade e ownership aprovados nas specs anteriores.
- O frontend permanece desacoplado de fornecedor; serviços server-side devem permanecer compatíveis com OpenTelemetry e propagação W3C.
- Sinais operacionais de rollout continuam pertencendo à plataforma de deployment.

## Assumptions

- Exporters e coletores locais determinísticos são suficientes para validar o contrato no case.
- Os contatos presentes nos manifestos são sintéticos.

## Edge Cases

- Contexto W3C ausente ou inválido em uma fronteira de entrada.
- Exporter indisponível ou lançando erro durante a emissão.
- Falhas simultâneas em jornadas distintas.

## Out of Scope

- Seleção ou provisionamento de fornecedor de observabilidade.
- Dashboards, alertas, escalonamento de incidentes ou SLOs de produção.
- Telemetria de Canary, Blue-Green, promoção, rollback ou infraestrutura de deployment.

## Open Questions

Nenhuma.
