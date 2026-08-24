// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import generatedManifest from "../../generated/product-catalog.v1.json";
import { ProductCatalogPage } from "./ProductCatalogPage.jsx";

afterEach(cleanup);

describe("final public catalog", () => {
  it.each(["Ox Alpha", "Nemotron 3.5 ASR", "Suno", "Topaz"])(
    "renders the supported %s card",
    (query) => {
      render(<ProductCatalogPage manifest={generatedManifest} />);
      fireEvent.change(screen.getByRole("searchbox", { name: "поиск по каталогу" }), {
        target: { value: query },
      });
      expect(screen.queryByText("ничего не найдено")).not.toBeInTheDocument();
      expect(screen.getAllByText(new RegExp(query, "iu")).length).toBeGreaterThan(0);
    },
  );

  it("keeps all three Suno cards", () => {
    expect(generatedManifest.models.filter(({ name }) => /suno/iu.test(name))).toHaveLength(3);
  });

  it.each(["Z-Image", "Motion Control", "Omni Video", "GigaChat"])(
    "does not render removed %s cards",
    (query) => {
      render(<ProductCatalogPage manifest={generatedManifest} />);
      fireEvent.change(screen.getByRole("searchbox", { name: "поиск по каталогу" }), {
        target: { value: query },
      });
      expect(screen.getByText("ничего не найдено")).toBeInTheDocument();
    },
  );
});
