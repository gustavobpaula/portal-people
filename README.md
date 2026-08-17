# Portal Pessoas — Fundação da Plataforma

## Pré-requisitos

- Node.js 24+
- Corepack habilitado (`corepack enable`)

## Comandos

```sh
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm nx build portal-host
corepack pnpm nx build neutral-remote
corepack pnpm verify:federation
corepack pnpm golden-path -- --name nova-jornada --dry-run
```

`portal-host` e `neutral-remote` também podem ser iniciados separadamente por `corepack pnpm nx serve <projeto>`. O host usa o manifesto local em `apps/portal-host/src/assets/journey-manifest.json` e carrega o remote em runtime.

O golden path cria um domínio a partir de um template versionado, sem editar configurações internas do shell. Para materializá-lo, remova `--dry-run`.

## Criando uma nova app de domínio

No marco atual, novas jornadas entram pelo golden path. Ele valida o nome em `kebab-case` e cria o esqueleto sob `apps/`, sem modificar o host.

1. Valide o nome e a estrutura que seria criada:

   ```sh
   corepack pnpm golden-path -- --name beneficios --dry-run
   ```

2. Materialize a app quando o domínio estiver aprovado:

   ```sh
   corepack pnpm golden-path -- --name beneficios
   ```

3. Revise os arquivos gerados:

   ```text
   apps/beneficios/
   ├── project.json
   └── src/
       └── Journey.tsx
   ```

4. Implemente a UI somente dentro do domínio e use a API pública de `@portal/platform-contracts`. A jornada recebe `PlatformCapabilities`; ela não deve importar internals do host, outro domínio, tokens de sessão ou estado de negócio global.

5. Valide o projeto e o workspace:

   ```sh
   corepack pnpm nx lint beneficios
   corepack pnpm typecheck
   ```

> O generator atual cria somente o esqueleto validado. A configuração de Vite, Module Federation, manifesto, telemetria e testes de integração será incorporada incrementalmente quando as próximas specs de shell e jornadas forem aprovadas. Não adicione essas integrações antecipadamente.

## Criando uma library

Crie uma library apenas quando houver uma responsabilidade reutilizável e um owner claro. Componentes ou regras de negócio de uma única jornada devem permanecer na app do domínio até que o reuso seja comprovado.

1. Escolha a fronteira e o owner. Use o padrão `libs/<dominio>/<capacidade>/`; por exemplo, `libs/beneficios/consulta/`.

2. Exponha somente a API pública em `src/index.ts`. Não importe internals de outro domínio, do shell ou do Design System.

3. Registre o projeto com `project.json`, seguindo o padrão das libraries existentes:

   ```json
   {
     "name": "beneficios-consulta",
     "sourceRoot": "libs/beneficios/consulta/src",
     "projectType": "library",
     "tags": ["scope:beneficios", "type:feature"],
     "targets": {
       "lint": {
         "command": "eslint libs/beneficios/consulta --max-warnings=0"
       }
     }
   }
   ```

4. Adicione o alias público no `tsconfig.base.json` e, enquanto o workspace ainda usa aliases explícitos, no `vite.config.ts` de cada consumidor autorizado.

5. Execute:

   ```sh
   corepack pnpm nx show project beneficios-consulta
   corepack pnpm lint
   corepack pnpm typecheck
   ```

Uma library transversal requer ownership da Plataforma Frontend. Para tokens e componentes compartilhados, prefira `libs/design-tokens` e `libs/design-system-web`; não crie uma nova library compartilhada para resolver um único caso de uso.

## Evolução planejada do golden path

| Marco | O que estará automatizado |
| --- | --- |
| Fundação atual | Nome válido, estrutura de domínio, tag Nx e contrato de plataforma. |
| Shell e contrato da plataforma | Remote Vite, configuração de Module Federation, manifesto local, fallback e teste de composição. |
| Jornadas de negócio | Telemetria do domínio, testes de jornada, estados de dados e consumo do Design System. |
| Operação e entrega | Manifesto por ambiente, rollout, budgets, observabilidade e gates afetados no CI. |

Cada etapa depende de uma spec aprovada. Até ela existir, mantenha o domínio no esqueleto atual em vez de antecipar infraestrutura ou contratos.
