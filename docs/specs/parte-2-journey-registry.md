# Feature Specification: Parte 2 — Journey Registry Demonstrativo

## Goal

Demonstrar o Journey Registry como uma aplicação server-side independente, mantida pela Plataforma Frontend e executada separadamente no monorepo, permitindo que o `portal-host` descubra jornadas por HTTP sem incorporar o catálogo principal ao seu código.

## Functional Requirements

- **FR-1:** O monorepo deve conter uma aplicação server-side `journey-registry`, com execução, testes e build independentes do `portal-host` e dos domínios.
- **FR-2:** O Journey Registry deve expor `GET /api/journeys` e responder com uma coleção determinística de manifestos já resolvidos e compatíveis com o contrato público da plataforma.
- **FR-3:** A demonstração integrada deve fazer o `portal-host` consultar o Journey Registry por HTTP real. MSW deve permanecer disponível somente para testes isolados e desenvolvimento do host sem o serviço.
- **FR-4:** O catálogo servido deve ser a fonte principal da demonstração integrada. O catálogo empacotado no shell deve funcionar somente como fallback seguro quando o serviço estiver indisponível ou responder de forma inválida.
- **FR-5:** O serviço deve ser mantido sob ownership da Plataforma Frontend e depender somente de contratos públicos, sem importar implementações do shell, remotes ou internals dos domínios.
- **FR-6:** Falhas HTTP, respostas malformadas e indisponibilidade do Registry devem produzir telemetria sanitizada e preservar shell, navegação e jornadas presentes no catálogo seguro.
- **FR-7:** O repositório deve oferecer comandos documentados para iniciar a demonstração integrada e verificar automaticamente o consumo do catálogo por HTTP e o fallback de indisponibilidade.
- **FR-8:** Cada squad deve manter, no caminho `journeys/<id>/manifest.json`, um manifesto declarativo versionado com `owner`. O Registry deve descobrir, validar e agregar essas declarações sem alteração do seu código ou do shell.

## Acceptance Criteria

- **AC-1 [FR-1, FR-5]:** Nx reconhece `journey-registry` como aplicação independente, com fronteiras que impedem imports de implementações do host e dos domínios.
- **AC-2 [FR-2]:** Uma chamada HTTP a `GET /api/journeys` retorna os manifestos demonstrativos de Benefícios, Férias, Holerite legado e Recursos do aplicativo, todos aceitos pelo schema público.
- **AC-3 [FR-3, FR-4]:** Com o serviço ativo, o catálogo de jornadas é preenchido a partir da resposta HTTP; Produtos e busca continuam sendo responsabilidade do Portal BFF. A demonstração integrada não depende da interceptação do endpoint pelo MSW.
- **AC-4 [FR-4, FR-6]:** Com o serviço encerrado, o shell informa a indisponibilidade, utiliza o catálogo seguro e mantém as jornadas navegáveis.
- **AC-5 [FR-2, FR-6]:** Resposta não JSON, status não bem-sucedido ou catálogo incompatível não substitui o catálogo seguro nem desmonta o shell.
- **AC-6 [FR-5]:** Testes de fronteira comprovam que Registry, shell e domínios compartilham apenas contratos públicos e não importam internals entre si.
- **AC-7 [FR-6]:** Eventos da integração incluem plataforma e correlação, sem manifestos completos, destinos, tokens, matrícula ou dados pessoais.
- **AC-8 [FR-7]:** Um comando reproduzível inicia Registry, host e dependências da demonstração, e uma verificação automatizada cobre sucesso HTTP e indisponibilidade do serviço.
- **AC-9 [FR-2, FR-5, FR-8]:** Uma nova declaração válida aparece no catálogo sem alteração do Registry ou do shell. Manifesto inválido, ID duplicado ou rota duplicada impede a publicação integral do catálogo.

## Constraints

- Seguir `docs/ARCHITECTURE.md`, especialmente AD-3, AD-7, AD-8, AD-12, AD-14, AD-17, AD-18, AD-21, AD-23 e AD-24.
- Reutilizar os schemas de manifesto de `@portal/platform-contracts`.
- O Journey Registry é uma aplicação demonstrativa local, não o serviço corporativo de produção.
- A decisão de composição pertence à Plataforma Frontend; autorização e elegibilidade reais permanecem em fontes backend confiáveis.
- A implementação deve continuar reproduzível localmente e não exigir serviços externos.

## Assumptions

- O catálogo determinístico é baseado em arquivos versionados, sem persistência ou publicação dinâmica.
- O serviço e o contrato são mantidos pela Plataforma Frontend, embora executados server-side.
- O catálogo empacotado atual representa a última versão segura para fallback.

## Edge Cases

- Serviço indisponível durante a inicialização ou após já ter respondido.
- Status HTTP não bem-sucedido, corpo não JSON ou coleção incompatível.
- Manifesto inválido, ID duplicado, rota duplicada ou diretório diferente do ID declarado.

## Out of Scope

- Banco de dados, painel administrativo ou persistência de manifestos.
- Autenticação, autorização, elegibilidade, feature flags ou segmentação reais.
- Journey Registry corporativo, deploy e infraestrutura de produção.
- Alteração dos contratos das estratégias `federated-module`, `external-web` e `native-route`.

## Governance

A Plataforma Frontend mantém o serviço, contratos, validações e disponibilidade do Registry. Cada squad indicada em `owner` mantém a declaração de sua jornada no caminho independente `journeys/<id>/manifest.json`.

Nesta demonstração, a governança verificável é feita pelo campo `owner`, validação de schema, identidade do diretório, duplicidade e fronteiras Nx. Em ambiente corporativo, esses caminhos devem ser associados aos times reais em `CODEOWNERS` ou mecanismo equivalente de aprovação.

## Open Questions

Nenhuma.
