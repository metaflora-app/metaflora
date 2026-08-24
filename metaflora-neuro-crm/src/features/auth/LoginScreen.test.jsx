// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginScreen } from "./LoginScreen.jsx";

describe("LoginScreen", () => {
  it("uses the real МЕТАФЛОРА mark instead of a text placeholder", () => {
    render(
      <LoginScreen
        onRequestCode={vi.fn()}
        onVerifyCode={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "МЕТАФЛОРА* нейро" })).toHaveAttribute(
      "src",
      "/assets/metaflora-mark.png",
    );
    expect(screen.queryByText("М*")) .not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "МЕТАФЛОРА* нейро" }).closest("div"))
      .toHaveClass("login-brand");
  });
});
