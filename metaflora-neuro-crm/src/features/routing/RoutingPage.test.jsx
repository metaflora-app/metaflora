import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoutingPage } from "./RoutingPage.jsx";

describe("RoutingPage", () => {
  it("shows RouterAI in the active fallback route without exposing legacy KIE", () => {
    render(
      <RoutingPage
        routes={[{
          id: "route-media",
          capability: "медиа",
          label: "генерация",
          enabled: true,
          steps: [
            { provider: "Polza", model: "Grom Art", timeout: 60, maxCost: 18, status: "healthy" },
            { provider: "RouterAI", model: "Seedance 2.5", timeout: 90, maxCost: 24, status: "healthy" },
          ],
        }]}
        onToggleRoute={vi.fn()}
        onSimulate={vi.fn()}
      />,
    );

    expect(screen.getByText("RouterAI")).toBeInTheDocument();
    expect(screen.queryByText(/KIE/i)).not.toBeInTheDocument();
  });
});
// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
