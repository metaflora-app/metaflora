// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { displayGenerationProvider, GenerationsPage } from "./GenerationsPage.jsx";

const generations = [
  {
    id: "gen-1",
    userId: "usr-1",
    userName: "Ирина Волкова",
    model: "GPT-5",
    provider: "OpenAI",
    modality: "text",
    status: "completed",
    durationMs: 1430,
    metacoinCost: 7,
    createdAt: "2026-07-30T08:00:00.000Z",
    prompt: "это нельзя показывать",
    output: "и это тоже нельзя показывать",
  },
];

const extendedGenerations = [
  ...generations,
  {
    id: "gen-tool",
    kind: "tool",
    userId: "usr-2",
    model: "удаление объекта",
    provider: "fal.ai",
    modality: "image",
    status: "completed",
  },
  {
    id: "gen-agent",
    kind: "agent",
    userId: "usr-3",
    model: "ИИ-юрист",
    provider: "OpenRouter",
    modality: "text",
    status: "running",
  },
];

afterEach(cleanup);

describe("GenerationsPage", () => {
  it("shows a safe provider label instead of leaking an unknown provider value", () => {
    expect(displayGenerationProvider("polza")).toBe("Polza AI");
    expect(displayGenerationProvider("routerai")).toBe("RouterAI");
    expect(displayGenerationProvider("unknown provider")).toBe(
      "провайдер не определён",
    );
  });

  it("renders operational metadata without prompt or output", () => {
    render(<GenerationsPage generations={generations} />);

    expect(screen.getAllByText("GPT-5").length).toBeGreaterThan(0);
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.queryByText("это нельзя показывать")).not.toBeInTheDocument();
    expect(screen.queryByText("и это тоже нельзя показывать")).not.toBeInTheDocument();
  });

  it("filters by status and delegates row selection", () => {
    const onFiltersChange = vi.fn();
    const onSelectGeneration = vi.fn();
    render(
      <GenerationsPage
        generations={generations}
        onFiltersChange={onFiltersChange}
        onSelectGeneration={onSelectGeneration}
      />,
    );

    fireEvent.change(screen.getByLabelText("статус генерации"), {
      target: { value: "completed" },
    });
    expect(onFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "completed" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "открыть генерацию gen-1" }));
    const selectedMetadata = onSelectGeneration.mock.calls[0][0];
    expect(selectedMetadata).toMatchObject({
      id: "gen-1",
      model: "GPT-5",
      provider: "OpenAI",
    });
    expect(selectedMetadata).not.toHaveProperty("prompt");
    expect(selectedMetadata).not.toHaveProperty("output");
  });

  it("filters by safe searchable metadata and modality", () => {
    render(<GenerationsPage generations={generations} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "поиск генераций" }), {
      target: { value: "OpenAI" },
    });
    fireEvent.change(screen.getByLabelText("формат"), {
      target: { value: "text" },
    });

    expect(screen.getByText("gen-1")).toBeInTheDocument();
  });

  it("handles sparse metadata and empty results", () => {
    render(
      <GenerationsPage
        generations={[
          {
            id: "gen-2",
            status: "running",
            modality: "audio",
            durationMs: 420,
            metacoinCost: 0,
            createdAt: "not-a-date",
          },
        ]}
      />,
    );

    expect(screen.getByText("420 мс")).toBeInTheDocument();
    expect(screen.getAllByText("аудио")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("статус генерации"), {
      target: { value: "failed" },
    });
    expect(screen.getByText("подходящих генераций нет")).toBeInTheDocument();
  });

  it("filters every product kind and model without exposing request contents", () => {
    render(<GenerationsPage generations={extendedGenerations} />);

    fireEvent.change(screen.getByLabelText("тип продукта"), {
      target: { value: "tool" },
    });
    expect(screen.getByText("gen-tool")).toBeInTheDocument();
    expect(screen.queryByText("gen-agent")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("тип продукта"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("модель или сценарий"), {
      target: { value: "ИИ-юрист" },
    });
    expect(screen.getByText("gen-agent")).toBeInTheDocument();
    expect(screen.queryByText("gen-tool")).not.toBeInTheDocument();
  });
});
