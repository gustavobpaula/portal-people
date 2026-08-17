// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Alert,
  AppHeader,
  Button,
  EmptyState,
  SearchField,
  Spinner,
  TextField,
} from "./index";

describe("design system public components", () => {
  afterEach(cleanup);
  it("disables and announces a loading button", () => {
    render(
      <Button loading loadingLabel="Enviando">
        Enviar
      </Button>,
    );
    expect(screen.getByRole("button", { name: /Enviar$/ })).toBeDisabled();
    expect(
      screen.getByRole("status", { name: "Enviando" }),
    ).toBeInTheDocument();
  });
  it("connects field hint and error with its input", () => {
    render(
      <TextField
        label="CPF"
        hint="Somente números"
        error="Campo obrigatório"
      />,
    );
    const input = screen.getByLabelText("CPF");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("-hint");
    expect(screen.getByRole("alert")).toHaveTextContent("Campo obrigatório");
  });
  it("submits and clears a controlled search field", () => {
    const change = vi.fn();
    const search = vi.fn();
    const { rerender } = render(
      <SearchField
        label="Buscar"
        value="férias"
        onValueChange={change}
        onSearch={search}
      />,
    );
    fireEvent.submit(screen.getByRole("search"));
    expect(search).toHaveBeenCalledWith("férias");
    fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(change).toHaveBeenCalledWith("");
    rerender(
      <SearchField
        label="Buscar"
        value=""
        onValueChange={change}
        onSearch={search}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Limpar busca" }),
    ).not.toBeInTheDocument();
  });
  it("exposes a labelled mobile navigation toggle", () => {
    render(
      <AppHeader
        navigationItems={[
          { id: "home", label: "Início", href: "/", current: true },
        ]}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Abrir navegação" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
  it("forwards navigation callbacks without changing native link behavior", () => {
    const onNavigate = vi.fn();
    const onHomeNavigate = vi.fn();
    render(
      <AppHeader
        onNavigate={onNavigate}
        onHomeNavigate={onHomeNavigate}
        navigationItems={[{ id: "journey", label: "Jornada", href: "/jornada" }]}
      />,
    );
    fireEvent.click(screen.getByRole("link", { name: "Jornada" }));
    fireEvent.click(screen.getByRole("link", { name: "Portal Pessoas" }), {
      metaKey: true,
    });
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onHomeNavigate).toHaveBeenCalledOnce();
    expect(onHomeNavigate.mock.calls[0][0].metaKey).toBe(true);
  });
  it("uses appropriate live regions for feedback and empty states", () => {
    const dismiss = vi.fn();
    render(
      <>
        <Alert tone="error" title="Não foi possível salvar" onDismiss={dismiss}>
          Tente novamente.
        </Alert>
        <Spinner label="Carregando conteúdo" />
        <EmptyState title="Nenhum resultado" description="Tente outro termo." />
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível salvar",
    );
    fireEvent.click(screen.getByRole("button", { name: "Fechar alerta" }));
    expect(dismiss).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("status", { name: "Carregando conteúdo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nenhum resultado" }),
    ).toBeInTheDocument();
  });
});
