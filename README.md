# Portal Pessoas

Case técnico de arquitetura frontend: a proposta para a próxima geração de um portal corporativo com dezenas de jornadas, mais de dez squads entregando em paralelo e sistemas legados que não podem sair do ar durante a migração — e uma aplicação que demonstra as decisões funcionando.

## Por onde começar

**Não é preciso rodar nada para avaliar a proposta.** Se você tem dez minutos:

| Leia | Para entender |
| --- | --- |
| [`docs/PROPOSTA-TECNICA.md`](docs/PROPOSTA-TECNICA.md) | a arquitetura proposta, as alternativas descartadas e os trade-offs de cada decisão |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | as 33 decisões arquiteturais registradas, com fronteiras e regras de dependência |
| [`journeys/*/manifest.json`](journeys/) | o contrato que permite incluir uma jornada sem alterar o core |
| [`docs/PARTE-2-ROADMAP.md`](docs/PARTE-2-ROADMAP.md) | como a aplicação foi entregue em 11 incrementos, e o que ficou fora de propósito |

Para ver rodando, `corepack pnpm demo:portal` sobe o portal completo em um comando.

## O que é simulado, e por quê

Portal BFF, feature flags, CI/CD, SSO, os aplicativos Kotlin/Swift e o Journey Registry corporativo **são simulados localmente de propósito**. A intenção foi preservar os contratos e o comportamento sob falha — carregamento em runtime, isolamento de erro, handoff para o legado — sem reimplementar infraestrutura que pertence a outras fronteiras. Os limites estão declarados em [`docs/PARTE-2-ROADMAP.md`](docs/PARTE-2-ROADMAP.md).

O Journey Registry é a exceção: ele roda como uma aplicação server-side de verdade, separada do portal, porque a descoberta de jornadas por HTTP é uma das decisões que o case precisava provar.

## Pré-requisitos

- Node.js 24+
- Corepack habilitado (`corepack enable`)
- Chromium instalado para as verificações de navegador (`corepack pnpm exec playwright install chromium`)

## Comandos

```sh
corepack pnpm install --frozen-lockfile                                  # Instala exatamente as dependências do lockfile.
corepack pnpm quality                                                    # Executa o gate completo de qualidade e entrega.
corepack pnpm quality:affected -- --files=apps/beneficios/src/app/Journey.tsx # Valida projetos afetados e checks transversais.
corepack pnpm verify:delivery                                            # Executa somente as verificações integradas de entrega.
corepack pnpm lint                                                       # Verifica padrões e erros estáticos do workspace.
corepack pnpm typecheck                                                  # Valida os tipos TypeScript sem gerar artefatos.
corepack pnpm test                                                       # Executa os testes automatizados de todos os projetos.
corepack pnpm nx build portal-host                                       # Gera o build de produção do shell.
corepack pnpm nx build neutral-remote                                    # Gera o build do remote neutro.
corepack pnpm nx lint beneficios                                         # Executa o lint do domínio Benefícios.
corepack pnpm nx test beneficios                                         # Executa os testes do domínio Benefícios.
corepack pnpm nx build beneficios                                        # Gera o build do domínio Benefícios.
corepack pnpm nx lint ferias                                             # Executa o lint do domínio Férias.
corepack pnpm nx test ferias                                             # Executa os testes do domínio Férias.
corepack pnpm nx build ferias                                            # Gera o build do domínio Férias.
corepack pnpm verify:federation                                          # Valida contratos e composição Module Federation.
corepack pnpm verify:shell                                               # Verifica shell, navegação e jornadas federadas.
corepack pnpm demo:portal                                                # Inicia Registry, shell, remotes e legado integrados.
corepack pnpm demo:journey-registry                                      # Inicia somente o Journey Registry em watch.
corepack pnpm verify:journey-registry                                    # Valida catálogo HTTP, fallback e recuperação do Registry.
corepack pnpm demo:legacy                                                # Inicia somente o Holerite legado.
corepack pnpm verify:external-web                                        # Verifica handoff, retorno e fallback do legado.
corepack pnpm verify:web-mobile-bridge                                   # Verifica browser, WebView e bridge simulada.
corepack pnpm golden-path -- --name nova-jornada --dry-run               # Simula a criação de um novo domínio sem gravar arquivos.
corepack pnpm storybook                                                  # Inicia a documentação do Design System.
corepack pnpm storybook:build                                            # Gera o Storybook estático de produção.
corepack pnpm test:design-system                                         # Testa stories, interações e acessibilidade do Design System.
corepack pnpm verify:design-system-assets                                # Impede ativos remotos ou não autorizados no Design System.
corepack pnpm verify:performance-budgets                                 # Mede e aplica os budgets gzip do shell e dos remotes.
corepack pnpm verify:accessibility                                       # Executa Axe nos fluxos críticos desktop e mobile.
```

## Mapa das aplicações e ownership

| Superfície | Projeto | Owner | Fronteira |
| --- | --- | --- | --- |
| Shell e experiências transversais | `apps/portal-host` | Plataforma Frontend | Compõe jornadas; não contém regras de domínio. |
| Fundação | `apps/neutral-remote` | Plataforma Frontend | Remote federado independente. |
| Benefícios | `apps/beneficios` | Squad Benefícios | Domínio e contrato público próprios. |
| Férias | `apps/ferias` | Squad Férias | Domínio e contrato público próprios. |
| Catálogo HTTP | `apps/journey-registry` | Plataforma Frontend | Valida e publica manifestos; não decide rollout. |
| Holerite legado | `fixtures/holerite-legado` | Folha de Pagamento | Destino externo controlado. |
| Contratos, runtime, bridge e telemetria | `libs/platform/*` | Plataforma Frontend | Capacidades transversais, sem regras de negócio. |
| Design System | `libs/design-*`, `apps/design-system-docs` | Design System | Tokens, componentes e documentação executável. |

Cada squad mantém seu manifesto em `journeys/<id>/manifest.json`. Domínios não importam outros domínios e o shell não importa suas implementações.

## Qualidade e entrega local

`quality` executa lint, tipos, testes orientados a risco, todos os builds — inclusive o Storybook estático — e as verificações transversais em sequência. A primeira falha obrigatória encerra o comando com código diferente de zero.

`quality:affected` usa `origin/main` e `HEAD` por padrão, aceita `--base`, `--head` ou `--files`, restringe lint/test/build ao grafo afetado do Nx e sempre mantém as verificações transversais. Exemplos:

```sh
corepack pnpm quality:affected -- --files=apps/beneficios/src/app/Journey.tsx # Simula uma alteração no domínio Benefícios.
corepack pnpm quality:affected -- --files=libs/platform/contracts/src/index.ts # Simula uma alteração em contrato compartilhado.
corepack pnpm quality:affected -- --files=journeys/beneficios/manifest.json # Simula uma alteração no manifesto de Benefícios.
```

### Verificações por domínio

`verify:shell`, `verify:accessibility` e `verify:performance-budgets` aceitam `--project` para uma jornada ou `--projects` para várias. Os identificadores atuais são `neutral-remote`, `beneficios` e `ferias`.

```sh
# Feedback da Squad Benefícios
corepack pnpm verify:shell -- --project=beneficios               # Verifica a composição de Benefícios pelo shell.
corepack pnpm verify:accessibility -- --project=beneficios       # Executa Axe nos fluxos de Benefícios.
corepack pnpm verify:performance-budgets -- --project=beneficios # Mede shell e carga incremental de Benefícios.

# Mudança compartilhada entre dois domínios
corepack pnpm verify:accessibility -- --projects=beneficios,ferias       # Executa Axe nos dois domínios.
corepack pnpm verify:performance-budgets -- --projects=beneficios,ferias # Mede os dois remotes.

# Remote neutro da Plataforma Frontend
corepack pnpm verify:shell -- --project=neutral-remote # Verifica o remote neutro pelo shell.
```

Mesmo filtrados, os verificadores iniciam o shell e suas dependências de composição. Sem filtro, percorrem todos os fluxos transversais e são o modo usado por `quality`, `quality:affected` e pelo gate de entrega.

### Budgets de transferência

| Caminho crítico | Alerta | Bloqueio |
| --- | ---: | ---: |
| JavaScript inicial do shell, gzip | 180 KiB | 200 KiB |
| JavaScript incremental por remote, gzip | 90 KiB | 100 KiB |
| Recursos totais do carregamento inicial, gzip | 315 KiB | 350 KiB |
| CSS crítico por rota, gzip | 30 KiB | 35 KiB |

KiB equivale a 1.024 bytes. A medição usa respostas realmente solicitadas de builds de produção: shell sem cache e remotes carregados incrementalmente após o shell. Alertas são visíveis sem falhar; ultrapassar o bloqueio encerra o gate. O relatório detalhado fica em `dist/quality/performance-budgets.json`.

LCP, INP e CLS permanecem observáveis com referências de `2,5 s`, `200 ms` e `0,1`, respectivamente, mas seus valores locais não bloqueiam a entrega. Não há meta percentual de cobertura; os testes são orientados a risco, contratos e fronteiras.

## Design System

`libs/design-tokens` publica os tokens semânticos e o tema; `libs/design-system-web` expõe os componentes React consumidos por shell e domínios. Os dois só podem ser importados pela API pública — `no-restricted-imports` reprova o acesso a caminhos internos, e `verify:design-system-assets` impede ativos remotos ou não autorizados.

`apps/design-system-docs` documenta tokens, componentes, estados e temas em um Storybook independente do shell, com testes de interação e verificação de acessibilidade. Componentes com regra de negócio permanecem no domínio até que o reuso seja comprovado.

```sh
corepack pnpm storybook              # Documentação executável em http://localhost:6006.
corepack pnpm test:design-system     # Stories, interações e acessibilidade.
```

## Observabilidade e operação

O shell cria uma correlação ao iniciar o portal. A mesma correlação é entregue aos remotes por `PlatformCapabilities` e segue para o Journey Registry em um cabeçalho W3C `traceparent`; cada requisição recebe um span distinto. O Registry extrai esse contexto — ou cria outro válido se ele estiver ausente ou inválido — e emite logs e métricas correlacionados.

O case emite sinais sanitizados no console local com o prefixo `portal-observability`. Cada linha é um envelope JSON com categoria (`log`, `error`, `metric` ou `analytics`), nome, timestamp, domínio, versão, rota-template, plataforma, correlação, namespace e atributos operacionais permitidos. Tokens, dados pessoais, conteúdo de jornadas, URLs completas, payloads HTTP e objetos da bridge não são exportados. Uma falha no exporter é isolada e não altera a experiência do portal.

Para observar a demonstração, inicie o portal, abra o DevTools e filtre o Console por `portal-observability`:

```sh
corepack pnpm demo:portal # Inicia a demonstração integrada completa.
```

O comando integrado também inicia o Journey Registry na porta `4204`. As portas esperadas são `4200`, `4201`, `4300`, `4301`, `4204` e `4500`; se alguma estiver ocupada, a inicialização falha com mensagem clara sem encerrar processos de terceiros. `Ctrl+C` encerra somente os recursos iniciados pelo comando, em ordem reversa, inclusive após uma inicialização parcial.

O host mede carregamento federado, chamadas do Registry e Core Web Vitals. Os eventos `portal.web-vital.lcp`, `portal.web-vital.inp` e `portal.web-vital.cls` são métricas com somente `value`, `rating` e `navigationType`: carregue a home para LCP, interaja com uma ação como Benefícios para INP e troque de aba para concluir o reporte de LCP/CLS.

```sh
corepack pnpm verify:observability # Valida correlação, ownership, sanitização e Web Vitals.
```

Esse comando inicia o Registry local, valida a propagação de `traceparent`, confirma ownership e namespaces dos manifestos e verifica os sinais estruturados do serviço sem credenciais ou fornecedor externo.

Ownership operacional: Plataforma Frontend mantém shell, runtime e Journey Registry; cada remote pertence à squad declarada em seu manifesto; Portal BFF e APIs pertencem aos respectivos times backend; bridge e WebView pertencem à Plataforma Mobile. Cada owner é responsável por dashboards, alertas e incidentes no ambiente corporativo. O case não provisiona fornecedores, alertas, SLOs ou infraestrutura de produção.

O Design System demonstrativo está em `libs/design-tokens` e `libs/design-system-web`; consumidores usam somente `@portal/design-tokens` e `@portal/design-system-web`. A documentação executável é servida de forma independente por Storybook.

`test:design-system` executa em Chromium os smoke tests, as `play` functions e as verificações de acessibilidade das stories. Após instalar as dependências, baixe o browser local uma vez (ou defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE` para usar um Chrome corporativo já instalado):

```sh
corepack pnpm exec playwright install chromium # Instala o Chromium usado pelos testes locais.
```

Os valores visuais são aproximações locais, não oficiais e substituíveis. O verificador de ativos impede referências remotas, fontes e recursos oficiais nos fontes do Design System.

`portal-host` e os remotes também podem ser iniciados separadamente por `corepack pnpm nx serve <projeto>`. No desenvolvimento isolado do host, o MSW responde `GET /api/journeys` com uma fixture local. Em modo integrado, essa rota é atendida pelo Journey Registry real por meio do proxy Vite.

Durante o desenvolvimento do `portal-host`, o Portal BFF simulado é iniciado automaticamente no navegador. Ele fornece dados sintéticos para Produtos, busca e notificações; nenhum backend externo é necessário.

## Journey Registry demonstrativo

O Registry é um serviço Fastify independente, mantido pela Plataforma Frontend. Ele lê, ordena e valida atomicamente os manifestos versionados em `journeys/<id>/manifest.json` antes de publicar `GET /api/journeys` na porta `4204`. Se qualquer manifesto for inválido ou houver ID/rota duplicado, o catálogo inteiro não é publicado.

Cada squad mantém o manifesto da jornada cujo `owner` a identifica. O serviço mantém o mecanismo, não a definição central das jornadas. Em uma organização real, esses caminhos devem ser protegidos por `CODEOWNERS` ou mecanismo equivalente associado aos times reais.

### Governança e resolução de jornadas

A governança é federada: a Plataforma Frontend mantém o Registry, seus contratos, validações e disponibilidade; cada squad mantém a declaração versionada da jornada pela qual responde. A separação é intencional:

```text
apps/beneficios/       → implementação React da experiência
journeys/beneficios/   → declaração de composição, rota, estratégia e owner
apps/journey-registry/ → descoberta, validação e publicação do catálogo
apps/portal-host/      → consumo do catálogo já resolvido
```

Ao iniciar, o Registry lê os manifestos em ordem determinística e valida a coleção inteira. Schema inválido, `owner` ausente, diretório diferente do ID declarado, ID duplicado ou rota duplicada impede a publicação integral: o serviço nunca entrega um catálogo parcial. Uma nova declaração válida não exige editar o shell nem o código do Registry.

O manifesto declara as possibilidades técnicas da jornada; ele não autoriza usuários nem decide público, canal ou rollout. Em produção, um BFF ou serviço confiável resolve essas regras antes de responder ao Registry — por exemplo, elegibilidade, feature flags, manutenção e contexto web ou aplicativo. O shell recebe apenas a coleção final permitida para aquela requisição e não escolhe entre alternativas de negócio.

Por exemplo, a mesma intenção de FAQ pode resultar em uma experiência web no navegador e em uma tela nativa dentro do aplicativo:

```text
Browser → BFF/Registry resolve FAQ como external-web ou federated-module → shell abre a experiência web
App     → BFF/Registry resolve FAQ como native-route                    → adapter WebView solicita a abertura nativa
```

No case, os arquivos são estáticos e determinísticos para demonstrar discovery, validação, consumo HTTP e fallback. A seleção contextual por sessão é uma evolução do serviço corporativo e preserva o mesmo contrato consumido pelo `portal-host`.

Para executar somente o Registry em watch:

```sh
corepack pnpm demo:journey-registry # Inicia somente o Registry em modo watch.
```

Para a demonstração integrada, que inicia Registry, remotes, host e legado, use `corepack pnpm demo:portal`. Se o Registry ficar indisponível, o host preserva seu snapshot seguro, informa o fallback e permite nova tentativa. A verificação automatizada exercita o endpoint HTTP, o proxy, o fallback e a recuperação:

```sh
corepack pnpm verify:journey-registry # Valida endpoint, proxy, fallback e recuperação.
```

## Testando `external-web` e Holerite legado

O comando abaixo inicia o host (`4200`), a jornada neutra, Benefícios (`4300`), Férias (`4301`) e a aplicação estática independente Holerite legado (`4500`). Encerre tudo com `Ctrl+C`.

```sh
corepack pnpm demo:portal # Inicia host, remotes, Registry e legado.
```

Abra `http://localhost:4200` e confirme que Produtos possui entradas distintas para Benefícios, Férias e Holerite legado. Depois selecione **Holerite legado** e verifique que:

- a jornada abre na mesma aba em `http://localhost:4500/holerite`;
- a página externa lista apenas holerites sintéticos;
- a URL possui somente `returnTo=http://localhost:4200/retorno/holerite-legado`, sem token, matrícula ou dados pessoais;
- **Voltar ao Portal Pessoas** retorna ao host em `localhost:4200`.

Benefícios e Férias continuam sendo remotes modernos independentes. Não existem Benefícios legado, Benefícios candidate, perfis de usuário ou controles locais de percentual e rollback.

Para iniciar ou interromper somente o legado, em outro terminal, use:

```sh
corepack pnpm demo:legacy # Inicia somente o destino legado na porta 4500.
```

Encerre esse terminal com `Ctrl+C`. Portal, Benefícios e Férias permanecem em execução quando iniciados separadamente.

Para demonstrar indisponibilidade externa sem afetar o portal, abra `http://localhost:4500/indisponivel` enquanto o demo estiver ativo. A página mantém a ação segura de retorno. Origem proibida, manifesto inválido e rota de retorno inválida são cobertos pelos testes unitários do runtime e do host.

Para demonstrar uma indisponibilidade real, inicie Portal, remotes e legado em terminais separados; depois encerre somente `demo:legacy`. Ao selecionar Holerite, o shell consulta `GET /health` no destino externo antes de navegar. Se não houver resposta, mantém o usuário no Portal, apresenta fallback com nova tentativa e preserva Benefícios e Férias.

O fluxo completo em desktop e viewport mobile é verificável em Chromium:

```sh
corepack pnpm verify:external-web # Verifica navegação externa, retorno e indisponibilidade.
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
corepack pnpm verify:web-mobile-bridge # Verifica browser, WebView e bridge simulada.
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

O limite é deliberado: o monorepo produz código, testes, relatórios e artefatos locais; pipelines hospedados, publicação, deploy, promoção, rollout, rollback, dashboards, alertas e fornecedores corporativos pertencem às plataformas externas responsáveis.

O golden path cria um domínio a partir de um template versionado, sem editar configurações internas do shell. Para materializá-lo, remova `--dry-run`.

## Criando uma nova app de domínio

No marco atual, novas jornadas entram pelo golden path. Ele valida o nome em `kebab-case` e cria o esqueleto sob `apps/`, sem modificar o host.

1. Valide o nome e a estrutura que seria criada:

   ```sh
   corepack pnpm golden-path -- --name beneficios --dry-run # Mostra os arquivos sem gravá-los.
   ```

2. Materialize a app quando o domínio estiver aprovado:

   ```sh
   corepack pnpm golden-path -- --name beneficios # Cria o domínio e seu manifesto.
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
corepack pnpm nx lint beneficios # Valida o código gerado para o domínio.
corepack pnpm typecheck          # Valida os tipos de todo o workspace.
   ```

> O generator cria um remote Vite com Module Federation, manifesto em `journeys/<id>/manifest.json` e teste smoke. Use `--port` para evitar colisão entre remotes. Após aprovação, a declaração é descoberta pelo Registry sem alteração do shell.

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
   corepack pnpm nx show project beneficios-consulta # Exibe a configuração Nx da library.
   corepack pnpm lint                                # Valida padrões do workspace.
   corepack pnpm typecheck                           # Valida os tipos do workspace.
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

## DD-1 reavaliada

O Journey Registry continua sendo o único serviço server-side frontend-owned e o Portal BFF permanece simulado no navegador. Como não existe um segundo serviço com convenções concretamente repetidas, o gatilho de `DD-1` não ocorreu e nenhum generator de serviços ou BFFs foi criado.
