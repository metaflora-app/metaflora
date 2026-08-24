// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProductCatalogPage } from "./ProductCatalogPage.jsx";

const manifest = Object.freeze({
  schemaVersion: "1.0.0",
  release: Object.freeze({ version: "2026.08.13", sourceHash: "abc123" }),
  summary: Object.freeze({ models: 404, agents: 50, tools: 42, workflows: 30, voices: 80, entertainments: 15 }),
  coverage: Object.freeze([
    Object.freeze({ id: "voice-library", label: "библиотека голосов", state: "ready", scope: "voice" }),
    Object.freeze({ id: "video-builder", label: "режимы видео", state: "ready", scope: "video" }),
  ]),
  models: Object.freeze([
    Object.freeze({ id: "seedance_25", name: "Seedance 2.5", category: "video", modes: ["text_to_video", "first_frame_to_video"], settings: ["duration", "aspect_ratio"] }),
  ]),
  agents: Object.freeze([
    Object.freeze({ id: "lawyer", name: "ИИ-юрист", category: "business", active: true }),
  ]),
  tools: Object.freeze([
    Object.freeze({ id: "photo_object_remove", name: "удалить объект", category: "photo", active: true, settings: [] }),
  ]),
  workflows: Object.freeze([
    Object.freeze({ id: "voice_tts", name: "озвучка", category: "voice", active: true, settings: ["voice"] }),
  ]),
  entertainments: Object.freeze([
    Object.freeze({ id: "ent_lila", name: "игра «лила»", category: "entertainment", description: "рефлексивная игра", inputHint: "назови тему", readiness: "ready", flowKind: "guided", entryOptions: 1 }),
  ]),
  entertainmentProfile: Object.freeze({ cover: Object.freeze({ key: "entertainment-section", alt: "развлечения с ИИ" }), ready: 15, total: 15, quizReady: true }),
  voiceProfile: Object.freeze({ curatedCount: 80, customVoiceSupported: true, sensitiveFieldsExposed: false }),
  musicProfile: Object.freeze({ constructorReady: true, runnableWorkflows: 2, stylePresetCount: 24, activeRoutes: 5, settings: ["result", "style", "lyrics", "duration", "prompt"], sensitiveFieldsExposed: false }),
});

afterEach(cleanup);

describe("ProductCatalogPage", () => {
  it("shows release counts and safe capability coverage", () => {
    render(<ProductCatalogPage manifest={manifest} />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("режимы видео")).toBeInTheDocument();
    expect(screen.getByText(/80 голосов/i)).toBeInTheDocument();
    expect(screen.getByText(/2 музыкальных сценариев/i)).toBeInTheDocument();
    expect(screen.getByText(/15 из 15 развлечений готовы/i)).toBeInTheDocument();
    expect(screen.queryByText(/systemPrompt|consent|audioUrl|voiceId/i)).not.toBeInTheDocument();
  });

  it("labels capability readiness in clear product language without internal contours", () => {
    render(<ProductCatalogPage manifest={manifest} />);

    const readiness = screen.getByRole("region", { name: "готовность возможностей" });
    expect(readiness).toHaveTextContent("готовность возможностей");
    expect(readiness).toHaveTextContent("библиотека голосов");
    expect(readiness).toHaveTextContent("режимы видео");
    expect(readiness).not.toHaveTextContent(/покрытие|контур/i);
  });

  it("filters across models, agents, tools, workflows, and entertainment", () => {
    render(<ProductCatalogPage manifest={manifest} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "поиск по каталогу" }), {
      target: { value: "Seedance" },
    });
    expect(screen.getByText("Seedance 2.5")).toBeInTheDocument();
    expect(screen.queryByText("ИИ-юрист")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("раздел каталога"), {
      target: { value: "tools" },
    });
    fireEvent.change(screen.getByRole("searchbox", { name: "поиск по каталогу" }), {
      target: { value: "" },
    });
    expect(screen.getByText("удалить объект")).toBeInTheDocument();
    expect(screen.queryByText("Seedance 2.5")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("раздел каталога"), {
      target: { value: "entertainments" },
    });
    expect(screen.getByText("игра «лила»")).toBeInTheDocument();
    expect(screen.getByText("рефлексивная игра")).toBeInTheDocument();
  });

  it("renders every catalog card name with strong emphasis", () => {
    render(<ProductCatalogPage manifest={manifest} />);

    expect(screen.getByText("Seedance 2.5").tagName).toBe("STRONG");
    expect(screen.getByText("ИИ-юрист").tagName).toBe("STRONG");
    expect(screen.getByText("удалить объект").tagName).toBe("STRONG");
  });
});
