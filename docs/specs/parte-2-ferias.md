# Feature Specification: Parte 2 — Jornada Férias

## Goal

Entregar uma jornada transacional de Férias como remote independente, permitindo consultar a elegibilidade, validar e revisar uma solicitação, enviá-la a uma API simulada e apresentar confirmação observável sem representar aprovação real.

## Functional Requirements

- **FR-1:** Férias deve ser um remote `federated-module` independente, registrado pelo manifesto local em `/ferias`, com build próprio, owner “Squad Férias” e sem imports do shell ou de outros domínios.
- **FR-2:** A jornada deve consultar uma API de domínio simulada e apresentar o saldo de dias e o período elegível antes de habilitar uma nova solicitação, com estados distintos de loading, indisponibilidade e erro recuperável.
- **FR-3:** O formulário deve solicitar data de início e quantidade de dias, usando React Hook Form e Zod. A interface e a API simulada devem rejeitar campos ausentes, quantidade não inteira ou não positiva, quantidade superior ao saldo e data fora do período elegível.
- **FR-4:** Uma solicitação válida deve avançar para uma revisão com data de início, quantidade de dias e período resultante, permitindo voltar para editar ou confirmar explicitamente o envio.
- **FR-5:** A confirmação deve enviar a solicitação uma única vez à API simulada, impedir novo acionamento enquanto houver requisição em andamento e, em caso de falha, preservar os dados para nova tentativa ou edição.
- **FR-6:** Após sucesso, a jornada deve apresentar protocolo sintético, período solicitado, quantidade de dias e status “Solicitação enviada”, sem afirmar que as férias foram aprovadas.
- **FR-7:** A jornada deve consumir somente APIs públicas do Design System e de `PlatformCapabilities`, operar por teclado e permanecer utilizável em viewports desktop e mobile, incluindo mensagens de validação e alterações assíncronas acessíveis.
- **FR-8:** Estado do formulário, consultas e cache devem pertencer ao domínio Férias, sem persistência no armazenamento do navegador e sem comunicação direta com Benefícios.
- **FR-9:** Carregamento da elegibilidade, validação, revisão, envio, sucesso, falha e nova tentativa devem emitir eventos pelo contrato da plataforma com domínio, versão, rota, plataforma e correlação quando disponíveis, sem datas, saldos, protocolos, tokens ou dados pessoais.
- **FR-10:** Como a estratégia aprovada para Férias é `federated-module`, sua estrutura inicial deve ser criada pelo golden path de `docs/specs/parte-2-shell-plataforma.md` `FR-8` antes de qualquer implementação funcional. A saída recém-gerada deve ser validada por lint, tipos, testes, build, manifesto, fronteiras e composição federada. Se uma falha for atribuída ao golden path, o plano e o escopo de entrega da etapa 6 devem incluir a correção do generator e seu teste de regressão, seguida por nova geração e validação; o defeito não pode ser mascarado somente por configuração específica de Férias.

## Acceptance Criteria

- **AC-1 [FR-1]:** O shell carrega Férias pelo manifesto em `/ferias`, o remote produz build independente e as verificações de fronteira impedem imports do shell, de Benefícios ou de outros domínios.
- **AC-2 [FR-2]:** Atraso, falha, saldo indisponível e ausência de dias elegíveis produzem estados distintos; uma falha recuperável permite repetir somente a consulta de elegibilidade.
- **AC-3 [FR-3]:** Cada entrada inválida apresenta mensagem associada ao campo, bloqueia a revisão e também é rejeitada pelo contrato da API simulada.
- **AC-4 [FR-4]:** Entradas válidas apresentam o resumo correto; voltar preserva os valores para edição e nenhum envio ocorre antes da confirmação explícita.
- **AC-5 [FR-5]:** Durante o envio, novos acionamentos ficam bloqueados; uma falha mantém os dados e permite tentar novamente ou editar sem recarregar a jornada.
- **AC-6 [FR-6]:** Uma resposta bem-sucedida substitui a revisão por uma confirmação com protocolo, período, quantidade e status “Solicitação enviada”.
- **AC-7 [FR-7]:** Consulta, preenchimento, validação, revisão, edição, confirmação e nova tentativa funcionam por teclado, possuem foco perceptível e são utilizáveis em desktop e viewport mobile.
- **AC-8 [FR-8, FR-9]:** Testes demonstram isolamento de estado e cache, ausência de persistência e eventos sanitizados sem valores do formulário, elegibilidade, protocolos, tokens ou dados pessoais.
- **AC-9 [FR-10]:** Há evidência de que o golden path criou a estrutura inicial antes do código funcional e de que uma saída recém-gerada passa por todas as validações exigidas. Se um defeito do generator for encontrado, o plano da etapa 6 registra sua correção, um teste reproduz a falha e a estrutura gerada após o ajuste comprova a regressão resolvida.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-4, AD-5, AD-13, AD-14, AD-17, AD-18, AD-22, AD-23 e AD-26–AD-30.
- Reutilizar o shell e o contrato de `docs/specs/parte-2-shell-plataforma.md` e somente a API pública de `docs/specs/parte-2-design-system.md`.
- A API de domínio deve ser local, determinística, autoritativa para a validação simulada e isolada do Portal BFF.
- O plano de implementação deve ordenar a criação pelo golden path, a validação da saída limpa, eventual correção do generator e somente então a implementação funcional.
- A validação deve incluir regras e schemas, componentes, contratos HTTP simulados, fluxo federado e fronteiras arquiteturais.

## Assumptions

- Saldo, elegibilidade, protocolo e solicitação são sintéticos e expressos em dias inteiros.
- O registro local contém uma entrada válida para Férias em `/ferias`.

## Edge Cases

- Elegibilidade indisponível, saldo zero ou ausência de período elegível.
- Dados rejeitados pela API simulada apesar da validação na interface.
- Falha no envio após a revisão.

## Out of Scope

- Aprovação por gestor, alteração ou cancelamento de solicitação, venda de dias, abono e adiantamento.
- Regras trabalhistas reais, backend ou BFF real, persistência entre sessões, deploy e infraestrutura.

## Open Questions

Nenhuma.
