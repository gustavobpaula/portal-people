# Referência visual pública — Itaú

## Fonte e finalidade

- Fonte observada: [itau.com.br](https://www.itau.com.br/).
- Data da observação: 14 de agosto de 2026.
- Finalidade: orientar um Design System demonstrativo para o case Portal Pessoas.
- Status: referência pública, não documentação nem Design System oficial do Itaú.

O projeto não copia componentes, folhas de estilo, fontes, ícones ou outros ativos do site. Os valores abaixo são aproximações locais e substituíveis, fixadas para manter a demonstração reproduzível mesmo que a página pública mude.

## Padrões observados

- Cabeçalho laranja de alto contraste; navegação horizontal no desktop e compacta no mobile.
- Superfícies brancas, áreas secundárias em cinzas claros e texto preto/cinza escuro.
- Azul escuro como cor institucional complementar e de links/ações secundárias.
- Cards com borda sutil, cantos arredondados, ícone, título e descrição curta.
- Hierarquia tipográfica marcada, espaço em branco generoso e escala baseada em múltiplos de 4 px.
- Ações com áreas clicáveis amplas, estados de foco, skip links, landmarks e nomes acessíveis.
- Conteúdo promocional responsivo com texto sobre imagem; esse padrão não será necessário no primeiro marco do portal.

## Tokens derivados

| Papel semântico | Valor inicial | Evidência/uso pretendido |
|---|---:|---|
| Marca primária | `#FF6200` | Cabeçalhos e realces de marca |
| Ação primária | `#E55800` | Botões e links de maior prioridade |
| Marca secundária | `#000066` | Ações e contraste institucional |
| Fundo padrão | `#FFFFFF` | Superfícies principais |
| Fundo sutil | `#F1F2F4` | Agrupamentos e estados neutros |
| Borda sutil | `#CFD1D3` | Delimitação de campos e cards |
| Texto primário | `#000000` | Títulos e conteúdo principal |
| Texto secundário | `#4C4C4C` | Apoio e metadados |

Espaçamento: `4`, `8`, `12`, `16`, `24`, `32`, `40` e `48px`. Raios: `4`, `8`, `12` e `16px`.

## Tipografia e ativos

O site expõe famílias identificadas como “Itau Text” e “Itau Display”. Elas não serão extraídas nem redistribuídas. O case usa `system-ui`, preservando peso, tamanho e altura de linha como mecanismos de hierarquia.

Ícones serão desenhados localmente como SVGs geométricos simples e decorativos, ou acompanhados por nomes acessíveis quando comunicarem uma ação. A marca do produto será apresentada textualmente como “Portal Pessoas”.

## Limitações

- A observação de uma página pública não revela regras internas, governança ou catálogo oficial de componentes.
- Similaridade visual não implica aprovação, associação ou conformidade com padrões internos do Itaú.
- WCAG 2.2 AA é requisito do case e será verificado no código produzido; não é uma afirmação sobre o site usado como referência.
