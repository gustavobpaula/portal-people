# Feature Specification: Parte 2 — Design System

## Goal

Entregar um Design System web demonstrativo, não oficial, baseado em padrões públicos observados no site do Itaú e adequado ao reuso futuro pelo shell e pelas jornadas.

## Functional Requirements

- **FR-1:** Tokens semânticos devem cobrir marca, superfícies, texto, bordas, feedback, espaçamento, raios, tipografia, elevação e movimento.
- **FR-2:** A referência visual e as derivações devem ser registradas em `docs/reference/itau-visual-reference.md` sem copiar código ou ativos proprietários.
- **FR-3:** A API pública deve expor `Text`, `Icon`, `Button`, `TextField`, `Surface`, `Spinner`, `Alert`, `AppHeader`, `Navigation`, `JourneyCard`, `SearchField` e `EmptyState`.
- **FR-4:** Componentes devem oferecer estados normal, hover, focus, active, disabled, loading e erro quando aplicáveis.
- **FR-5:** Storybook deve documentar tokens, propriedades, estados, composição, responsividade, temas e orientações de acessibilidade.
- **FR-6:** Estilos devem usar CSS Custom Properties, CSS Modules e SCSS, sem dependência runtime do site oficial.
- **FR-7:** A experiência deve atender WCAG 2.2 AA para semântica, teclado, foco visível, nomes acessíveis, contraste, reflow e redução de movimento dentro da superfície implementada.

## Acceptance Criteria

- **AC-1 [FR-1, FR-2]:** Tokens derivados são documentados como não oficiais, substituíveis e fixados localmente.
- **AC-2 [FR-3]:** Consumidores importam tokens, estilos e componentes somente pelo entry point público da biblioteca.
- **AC-3 [FR-4]:** Stories demonstram estados relevantes sem depender do shell ou de dados de negócio.
- **AC-4 [FR-5]:** Storybook executa e gera artefato estático independente.
- **AC-5 [FR-6]:** Nenhum arquivo, fonte, ícone ou stylesheet do site oficial é carregado pela aplicação.
- **AC-6 [FR-7]:** Componentes interativos operam por teclado, possuem foco perceptível, nomes coerentes e alvos adequados em desktop e mobile.
- **AC-7 [FR-3, FR-7]:** Testes de componentes cobrem interação, estados, mensagens e semântica pública.

## Constraints

- Seguir AD-11, AD-29 e AD-31 de `docs/ARCHITECTURE.md`.
- Usar `system-ui`; as famílias “Itau Text” e “Itau Display” não serão distribuídas.
- Componentes de Benefícios e Férias permanecem nos respectivos domínios futuros.

## Assumptions

- A observação visual foi realizada em 14 de agosto de 2026.
- A identidade inicial será uma aproximação para o case, não uma representação oficial.

## Edge Cases

- Texto longo, erro de campo, ação em loading e navegação em viewport estreita.
- `prefers-reduced-motion` deve desativar animações não essenciais.

## Out of Scope

- Biblioteca nativa, pacote externo, publicação em registry e reprodução do logotipo oficial.

## Open Questions

Nenhuma.
