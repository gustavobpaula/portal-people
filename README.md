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
corepack pnpm nx lint beneficios
corepack pnpm nx test beneficios
corepack pnpm nx build beneficios
corepack pnpm nx lint ferias
corepack pnpm nx test ferias
corepack pnpm nx build ferias
corepack pnpm verify:federation
corepack pnpm verify:shell
corepack pnpm demo:portal
corepack pnpm demo:legacy
corepack pnpm verify:external-web
corepack pnpm verify:web-mobile-bridge
corepack pnpm golden-path -- --name nova-jornada --dry-run
corepack pnpm storybook
corepack pnpm storybook:build
corepack pnpm test:design-system
corepack pnpm verify:design-system-assets
```

## Design System

O Design System demonstrativo está em `libs/design-tokens` e `libs/design-system-web`; consumidores usam somente `@portal/design-tokens` e `@portal/design-system-web`. A documentação executável é servida de forma independente por Storybook.

`test:design-system` executa em Chromium os smoke tests, as `play` functions e as verificações de acessibilidade das stories. Após instalar as dependências, baixe o browser local uma vez (ou defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para usar um Chrome corporativo já instalado):

```sh
corepack pnpm exec playwright install chromium
```

Os valores visuais são aproximações locais, não oficiais e substituíveis. O verificador de ativos impede referências remotas, fontes e recursos oficiais nos fontes do Design System.

`portal-host` e os remotes também podem ser iniciados separadamente por `corepack pnpm nx serve <projeto>`. No case, o host consome `GET /api/journeys`; o MSW responde com uma fixture local determinística de manifestos já resolvidos. Em produção, essa mesma rota seria fornecida pela API backend Journey Registry.

Durante o desenvolvimento do `portal-host`, o Portal BFF simulado é iniciado automaticamente no navegador. Ele fornece dados sintéticos para Produtos, busca e notificações; nenhum backend externo é necessário.

## Testando `external-web` e Holerite legado

O comando abaixo inicia o host (`4200`), a jornada neutra, Benefícios (`4300`), Férias (`4301`) e a aplicação estática independente Holerite legado (`4500`). Encerre tudo com `Ctrl+C`.

```sh
corepack pnpm demo:portal
```

Abra `http://localhost:4200` e confirme que Produtos possui entradas distintas para Benefícios, Férias e Holerite legado. Depois selecione **Holerite legado** e verifique que:

- a jornada abre na mesma aba em `http://localhost:4500/holerite`;
- a página externa lista apenas holerites sintéticos;
- a URL possui somente `returnTo=http://localhost:4200/retorno/holerite-legado`, sem token, matrícula ou dados pessoais;
- **Voltar ao Portal Pessoas** retorna ao host em `localhost:4200`.

Benefícios e Férias continuam sendo remotes modernos independentes. Não existem Benefícios legado, Benefícios candidate, perfis de usuário ou controles locais de percentual e rollback.

Para iniciar ou interromper somente o legado, em outro terminal, use:

```sh
corepack pnpm demo:legacy
```

Encerre esse terminal com `Ctrl+C`. Portal, Benefícios e Férias permanecem em execução quando iniciados separadamente.

Para demonstrar indisponibilidade externa sem afetar o portal, abra `http://localhost:4500/indisponivel` enquanto o demo estiver ativo. A página mantém a ação segura de retorno. Origem proibida, manifesto inválido e rota de retorno inválida são cobertos pelos testes unitários do runtime e do host.

Para demonstrar uma indisponibilidade real, inicie Portal, remotes e legado em terminais separados; depois encerre somente `demo:legacy`. Ao selecionar Holerite, o shell consulta `GET /health` no destino externo antes de navegar. Se não houver resposta, mantém o usuário no Portal, apresenta fallback com nova tentativa e preserva Benefícios e Férias.

O fluxo completo em desktop e viewport mobile é verificável em Chromium:

```sh
corepack pnpm verify:external-web
```

## Web/mobile e bridge simulada

Produtos também contém **Recursos do aplicativo**, uma jornada sintética `native-route`. No navegador ela exibe o fallback “Este recurso está disponível apenas no aplicativo.”, sem desmontar o Portal.

Durante o desenvolvimento, abra `http://localhost:4200/?platform=webview` e selecione a jornada para usar a bridge simulada. Ela aceita somente a rota registrada `portal-pessoas://recursos`, não armazena sessão ou dados e confirma a abertura no próprio case. O parâmetro é ignorado em builds de produção.

### Modelo mental: WebView, bridge e `native-route`

Em produção, o aplicativo nativo abre o `portal-host` em uma WebView. A mesma composição React — shell, Home, Produtos, busca, notificações e remotes de domínio — continua executando dentro dessa WebView. A bridge é o canal estrito entre esse conteúdo web e o aplicativo, não uma segunda aplicação web nem um backend.

```text
App nativo
  └─ WebView
      └─ portal-host
          ├─ shell e experiências transversais
          └─ domínios React registrados
```

O case demonstra o sentido **web → nativo**. A rota web `/recursos-do-app` e o destino nativo `portal-pessoas://recursos` são distintos: a primeira mostra a jornada dentro do Portal; o segundo é um destino que pertence ao aplicativo nativo.

```text
Usuário acessa /recursos-do-app
  → NativeJourneySlot lê o manifesto `native-route`
  → PlatformAdapter valida modo, origem, versão, capability e payload
  → bridge recebe `open-native-route(portal-pessoas://recursos)`
  → app nativo decide como abrir a tela nativa
```

No navegador, o shell usa o adapter `web`. A rota `/recursos-do-app` é renderizada, mas nenhuma navegação nativa é disparada: o adapter responde `native-unavailable` e o Portal mostra o fallback controlado. Dentro do app, o shell usa o adapter `webview`; se a bridge negociar a capability `native-navigation`, o destino registrado é enviado ao host nativo. Versão incompatível, origem negada, payload inválido, ausência, timeout ou rejeição da bridge também preservam o shell e exibem um fallback.

O monorepo não conhece Android Intents, Swift ou a implementação final de deep links. Ele só conhece uma `nativeRoute` validada no manifesto. O aplicativo pode implementar a abertura usando deep link internamente, mas essa decisão fica no host nativo. Somente o shell acessa a bridge; os domínios recebem apenas `PlatformCapabilities`.

O sentido **nativo → web** já existe no nível de hospedagem: o app carrega o Portal na WebView. Esta fase não define mensagens de contexto adicionais do nativo para o Portal, como rota inicial, tema, conectividade ou retorno de tela nativa. Caso sejam necessárias, devem ser adicionadas em contrato versionado e com dados mínimos; tokens, sessão, perfil completo e objetos de negócio não devem transitar pela bridge.

Verifique browser, WebView simulada e viewport mobile com:

```sh
corepack pnpm verify:web-mobile-bridge
```

### Como funcionaria em produção

O monorepo contém o código atual das aplicações e as estratégias de composição. O fluxo operacional acontece fora dele:

1. A squad aprova e integra uma mudança na branch principal.
2. O CI/CD testa, gera uma release e publica um artefato imutável.
3. A plataforma de deployment controla ambiente, Canary, Blue-Green, promoção e rollback.
4. Feature flags ou serviços backend podem decidir quais jornadas um usuário está autorizado a acessar.
5. A API backend **Journey Registry** devolve ao shell somente os manifestos e destinos já resolvidos para aquela sessão.
6. O shell valida cada manifesto e executa `federated-module`, `external-web` ou `native-route`; ele não escolhe candidate, stable, público ou percentual.

Versão e compatibilidade permanecem no manifesto para identificação, diagnóstico, telemetria e validação técnica. O case não reproduz CI/CD, plataforma de deployment, feature flags ou segmentação.

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
       ├── app/
       │   └── Journey.tsx
       └── main.tsx
   ```

4. Implemente a UI em `src/app/` e use a API pública de `@portal/platform-contracts`. Materialize `domain/`, `services/`, `mocks/` e `test/` somente quando a responsabilidade existir. A jornada recebe `PlatformCapabilities`; ela não deve importar internals do host, outro domínio, tokens de sessão ou estado de negócio global.

5. Valide o projeto e o workspace:

   ```sh
corepack pnpm nx lint beneficios
corepack pnpm typecheck
   ```

> O generator cria um remote Vite com Module Federation, manifesto local e teste smoke. Use `--port` para evitar colisão entre remotes e adicione o conteúdo de `journey-manifest.json` ao registro local do host quando a jornada for aprovada; o generator não altera o shell.

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
     "tags": ["scope:domain", "domain:beneficios", "type:feature"],
     "targets": {
       "lint": {
         "command": "eslint libs/beneficios/consulta --max-warnings=0"
       }
     }
   }
   ```

4. Use as tags `scope:domain`, `domain:<dominio>` e o respectivo `type:*` em cada library da jornada. Ela pode depender do próprio domínio, da plataforma e do Design System, mas não de outro domínio. Em seguida, adicione o alias público no `tsconfig.base.json` e, enquanto o workspace ainda usa aliases explícitos, no `vite.config.ts` de cada consumidor autorizado.

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
| Operação e entrega | Contratos de manifesto, budgets, observabilidade e gates afetados no CI; rollout permanece na plataforma externa de deployment. |

Cada etapa depende de uma spec aprovada. Até ela existir, mantenha o domínio no esqueleto atual em vez de antecipar infraestrutura ou contratos.
