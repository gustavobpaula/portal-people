import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import {
  Alert,
  AppHeader,
  Button,
  EmptyState,
  Icon,
  JourneyCard,
  SearchField,
  Spinner,
  Surface,
  Text,
  TextField,
} from "./index";

const meta = {
  title: "Componentes/Visão geral",
  component: Button,
  tags: ["test"],
  parameters: { controls: { disable: true } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TypographyAndSurfaces: Story = {
  render: () => (
    <Surface as="section" padding="lg" elevation={1}>
      <Text as="h1" variant="display">
        Portal Pessoas
      </Text>
      <Text tone="muted">
        Texto longo e responsivo para demonstrar a hierarquia tipográfica e o
        reflow sem dependência de negócio.
      </Text>
    </Surface>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Portal Pessoas" }),
    ).toBeVisible();
  },
};
export const ButtonsAndFields: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button>Primário</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="ghost">Terciário</Button>
        <Button loading>Enviar</Button>
      </div>
      <TextField
        label="CPF"
        hint="Informe somente números"
        error="Campo obrigatório"
      />
      <Icon name="calendar" label="Calendário" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Primário" }),
    ).toBeVisible();
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Campo obrigatório",
    );
  },
};
export const Feedback: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      <Alert title="Atualização concluída" tone="success">
        Os dados foram salvos.
      </Alert>
      <Alert title="Atenção" tone="warning">
        Revise os campos destacados.
      </Alert>
      <Spinner label="Carregando conteúdo" />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("status", { name: "Carregando conteúdo" }),
    ).toBeVisible();
  },
};
export const NavigationAndHeader: Story = {
  parameters: { viewport: { defaultViewport: "mobile" } },
  render: () => (
    <AppHeader
      onNavigate={(item, event) => {
        if (!event.metaKey && !event.ctrlKey && event.button === 0) event.preventDefault();
        console.info("storybook-navigation", item.href);
      }}
      navigationItems={[
        { id: "home", label: "Início", href: "/", current: true },
        {
          id: "benefits",
          label: "Benefícios",
          href: "/beneficios",
          icon: "gift",
        },
      ]}
      actions={<Button variant="ghost">Entrar</Button>}
    />
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Abrir navegação" }),
    ).toBeVisible();
  },
};
export const CardsAndEmpty: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <JourneyCard
        href="/ferias"
        title="Férias"
        description="Consulte seu período disponível e planeje sua pausa."
        icon="calendar"
        eyebrow="Jornada"
        badge="Novo"
      />
      <EmptyState
        title="Nenhuma solicitação encontrada"
        description="Tente ajustar os filtros."
        action={<Button>Limpar filtros</Button>}
      />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /Férias/ })).toBeVisible();
  },
};
export const Search: Story = {
  render: function SearchExample() {
    const [value, setValue] = useState("");
    return (
      <SearchField
        label="Buscar no portal"
        value={value}
        onValueChange={setValue}
        onSearch={() => undefined}
        placeholder="O que você procura?"
        error={value === "erro" ? "Termo indisponível" : undefined}
      />
    );
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("search")).toBeVisible();
  },
};
