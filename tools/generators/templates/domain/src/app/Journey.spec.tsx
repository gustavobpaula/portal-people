import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import Journey from "./Journey";
it("renders the generated journey", () => {
  render(
    <Journey
      platform={{
        navigate: () => undefined,
        context: { correlationId: "test", locale: "pt-BR", platform: "web" },
        telemetry: { track: () => undefined },
        flags: {},
        notifications: { show: () => undefined },
        device: { isAvailable: () => false },
      }}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "__DISPLAY_NAME__" }),
  ).toBeInTheDocument();
});
