# Feature Specification: Parte 2 — Jornada Benefícios

## Goal

Entregar uma jornada consultiva de Benefícios como remote independente, permitindo visualizar benefícios e seus detalhes com dados sintéticos, estados assíncronos observáveis e isolamento em relação ao shell e aos demais domínios.

## Functional Requirements

- **FR-1:** Benefícios deve ser um remote `federated-module` independente, registrado pelo manifesto local, com build próprio, owner “Squad Benefícios” e sem imports do shell ou de outros domínios.
- **FR-2:** A rota principal `/beneficios` deve consultar uma API de domínio simulada e listar os benefícios disponíveis com nome, categoria, status e resumo.
- **FR-3:** A seleção de um benefício deve navegar para a rota relativa `/:beneficioId`, controlada pelo remote, e apresentar os dados detalhados fornecidos pela API simulada.
- **FR-4:** A lista e o detalhe devem apresentar estados distintos de loading, vazio e erro recuperável, com nova tentativa restrita à consulta que falhou. Um identificador inexistente deve apresentar estado de não encontrado e retorno seguro à lista.
- **FR-5:** A jornada deve consumir somente APIs públicas do Design System e do contrato `PlatformCapabilities`, operar por teclado e funcionar em viewports desktop e mobile.
- **FR-6:** Consultas e cache devem pertencer ao domínio Benefícios, usando uma instância própria de TanStack Query e sem persistir dados da jornada no armazenamento do navegador.
- **FR-7:** Carregamento da lista, abertura de detalhe, falha e nova tentativa devem emitir eventos pelo contrato da plataforma com domínio, versão, rota, plataforma e correlação quando disponíveis, sem conteúdo dos benefícios, tokens ou dados pessoais.
- **FR-8:** A jornada deve ser exclusivamente consultiva, sem ações que alterem adesão, cobertura, contratação ou cancelamento de benefícios.
- **FR-9:** O remote Benefícios deve ser criado pelo golden path aprovado em `docs/specs/parte-2-shell-plataforma.md` `FR-8`. Antes da implementação funcional, o esqueleto gerado deve ter lint, tipos, testes, build e composição federada validados. Um defeito do generator que impeça essa validação deve ser corrigido no próprio golden path, com teste de regressão, sem ser contornado exclusivamente por configuração específica de Benefícios.

## Acceptance Criteria

- **AC-1 [FR-1]:** O shell carrega Benefícios pelo manifesto em `/beneficios`, o remote produz build independente e as verificações de fronteira impedem imports do shell ou de outros domínios.
- **AC-2 [FR-2]:** Uma resposta bem-sucedida da API simulada apresenta todos os benefícios recebidos com nome, categoria, status e resumo.
- **AC-3 [FR-3]:** Selecionar um benefício atualiza a URL e apresenta seu detalhe; acesso direto ou refresh nessa URL restaura o mesmo detalhe.
- **AC-4 [FR-4]:** Atraso, coleção vazia, falha da lista, falha do detalhe e identificador inexistente apresentam estados distintos; tentar novamente repete somente a consulta selecionada.
- **AC-5 [FR-5]:** Lista, seleção, detalhe, retorno e nova tentativa operam por teclado, possuem foco perceptível e permanecem utilizáveis em desktop e viewport mobile.
- **AC-6 [FR-6]:** Testes demonstram que consultas e cache permanecem no domínio e que nenhum dado da jornada é gravado em armazenamento persistente do navegador.
- **AC-7 [FR-7]:** Testes verificam os eventos definidos e confirmam que seus payloads não contêm conteúdo de benefícios, tokens ou dados pessoais.
- **AC-8 [FR-8]:** Nenhuma superfície da jornada oferece ação de adesão, alteração, contratação ou cancelamento.
- **AC-9 [FR-9]:** O comando documentado do golden path gera o remote Benefícios sem editar o shell, e a saída gerada passa por lint, tipos, testes, build e verificação de composição. Se um defeito do generator for encontrado, um teste reproduz a falha e comprova sua correção para um remote gerado.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-4, AD-5, AD-13, AD-14, AD-17, AD-18, AD-22, AD-23, AD-26, AD-27 e AD-30.
- Reutilizar o shell e o contrato aprovados em `docs/specs/parte-2-shell-plataforma.md` e somente a API pública aprovada em `docs/specs/parte-2-design-system.md`.
- A API de domínio deve ser uma simulação local, determinística e isolada do Portal BFF.
- A validação deve incluir testes de componente, contratos HTTP simulados, roteamento federado e isolamento de fronteiras.

## Assumptions

- Os dados simulados são sintéticos e não contêm dados pessoais.
- O registro local possui uma entrada válida para o remote Benefícios em `/beneficios`.

## Edge Cases

- Coleção de benefícios vazia.
- Resposta atrasada ou falha da API simulada.
- Benefício solicitado por identificador inexistente.

## Out of Scope

- Adesão, alteração, contratação ou cancelamento de benefícios.
- Backend ou BFF real, persistência entre sessões, integração com fornecedores, deploy e infraestrutura.
- Jornada Férias e alterações nas experiências transversais.

## Open Questions

Nenhuma.
