// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PromoCodesPanel } from "./PromoCodesPanel.jsx";

afterEach(cleanup);

describe("PromoCodesPanel", () => {
  const catalogModels = [
    { id: "gpt_56_luna", name: "GPT-5.6 Luna" },
    { id: "gpt_56_terra", name: "GPT-5.6 Terra" },
  ];

  it("creates an arbitrary positive metacoin grant", () => {
    const onCreate = vi.fn();
    render(<PromoCodesPanel promos={[]} models={catalogModels} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("код"), { target: { value: "COINS375" } });
    fireEvent.change(screen.getByLabelText("тип бонуса"), { target: { value: "metacoins" } });
    fireEvent.change(screen.getByLabelText("метакоины"), { target: { value: "375" } });
    fireEvent.click(screen.getByRole("button", { name: "создать промокод" }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      code: "COINS375",
      rewardType: "metacoins",
      rewardValue: 375,
      modelIds: [],
    }));
  });

  it("creates a 1-100 percent discount scoped to multiple real catalog models", () => {
    const onCreate = vi.fn();
    render(<PromoCodesPanel promos={[]} models={catalogModels} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("код"), { target: { value: "MODELS42" } });
    fireEvent.change(screen.getByLabelText("тип бонуса"), { target: { value: "discount_percent" } });
    fireEvent.change(screen.getByLabelText("процент скидки"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "GPT-5.6 Luna" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "GPT-5.6 Terra" }));
    fireEvent.click(screen.getByRole("button", { name: "создать промокод" }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      code: "MODELS42",
      rewardType: "discount_percent",
      rewardValue: 42,
      modelIds: ["gpt_56_luna", "gpt_56_terra"],
    }));
  });

  it("rejects percentage values outside 1-100", () => {
    const onCreate = vi.fn();
    render(<PromoCodesPanel promos={[]} models={catalogModels} onCreate={onCreate} />);
    fireEvent.change(screen.getByLabelText("код"), { target: { value: "BAD101" } });
    fireEvent.change(screen.getByLabelText("тип бонуса"), { target: { value: "discount_percent" } });
    fireEvent.change(screen.getByLabelText("процент скидки"), { target: { value: "101" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "GPT-5.6 Luna" }));
    fireEvent.click(screen.getByRole("button", { name: "создать промокод" }));
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/1.*100/);
  });

  const models = [
    { id: "gpt-5.6", name: "GPT-5.6" },
    { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
    { id: "kling-3", name: "Kling 3.0" },
  ];

  it("offers exactly the two supported custom promo types", () => {
    render(<PromoCodesPanel promos={[]} models={models} onCreate={vi.fn()} />);

    const type = screen.getByRole("combobox", { name: "тип бонуса" });
    const options = within(type).getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options.map(({ value }) => value)).toEqual(["metacoins", "discount_percent"]);
    expect(options.map(({ textContent }) => textContent)).toEqual([
      "метакоины",
      "скидка на модели",
    ]);
  });

  it("shows a model multi-select only for a model discount and submits selected IDs", () => {
    const onCreate = vi.fn();
    render(<PromoCodesPanel promos={[]} models={models} onCreate={onCreate} />);

    expect(screen.queryByRole("group", { name: "модели" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "тип бонуса" }), {
      target: { value: "discount_percent" },
    });

    const modelPicker = screen.getByRole("group", { name: "модели" });
    const choices = within(modelPicker).getAllByRole("checkbox");
    expect(choices).toHaveLength(3);
    fireEvent.click(within(modelPicker).getByRole("checkbox", { name: "GPT-5.6" }));
    fireEvent.click(within(modelPicker).getByRole("checkbox", { name: "Kling 3.0" }));
    fireEvent.change(screen.getByLabelText("код"), { target: { value: "models20" } });
    fireEvent.change(screen.getByLabelText("процент скидки"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "создать промокод" }));

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      rewardType: "discount_percent",
      rewardValue: 20,
      modelIds: ["gpt-5.6", "kling-3"],
    }));
  });

  it("renders a compact searchable model picker with visible labels", () => {
    render(<PromoCodesPanel promos={[]} models={models} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: "тип бонуса" }), {
      target: { value: "discount_percent" },
    });

    const picker = screen.getByRole("group", { name: "модели" });
    expect(within(picker).getByText("выбрано: 0")).toBeInTheDocument();
    expect(within(picker).getAllByRole("checkbox")[0]).toHaveClass("promo-model-picker__checkbox");
    fireEvent.change(within(picker).getByRole("searchbox", { name: "найти модель" }), {
      target: { value: "claude" },
    });
    expect(within(picker).getByText("Claude Sonnet 5")).toBeVisible();
    expect(within(picker).queryByText("GPT-5.6")).not.toBeInTheDocument();
  });

  it("keeps fields accessible and warns before a discount erases target margin", () => {
    render(
      <PromoCodesPanel
        promos={[]}
        models={models}
        targetMarginPercent={50}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: "код" })).toBeRequired();
    fireEvent.change(screen.getByRole("combobox", { name: "тип бонуса" }), {
      target: { value: "discount_percent" },
    });
    expect(screen.getByRole("spinbutton", { name: "процент скидки" })).toBeRequired();
    expect(screen.getByRole("spinbutton", { name: "общий лимит" }))
      .toHaveAccessibleName("общий лимит");
    expect(screen.getByLabelText("действует до")).toHaveAttribute("type", "date");

    fireEvent.change(screen.getByRole("spinbutton", { name: "процент скидки" }), {
      target: { value: "60" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "скидка 60% превышает целевую маржу 50%",
    );
    expect(screen.getByRole("button", { name: "создать промокод" })).toBeEnabled();
  });

  it("normalizes and submits a new promo through the handler", () => {
    const onCreate = vi.fn();
    render(<PromoCodesPanel promos={[]} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("код"), {
      target: { value: " welcome20 " },
    });
    fireEvent.change(screen.getByLabelText("метакоины"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "создать промокод" }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "WELCOME20",
        rewardType: "metacoins",
        rewardValue: 20,
      }),
    );
  });

  it("renders promo statuses and routes status changes", () => {
    const onStatusChange = vi.fn();
    render(
      <PromoCodesPanel
        promos={[
          {
            id: "promo-1",
            code: "WELCOME20",
            active: true,
            discountType: "percent",
            discountValue: 20,
            redemptionCount: 14,
            maxRedemptions: 100,
          },
        ]}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText("активен")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "приостановить WELCOME20" }),
    );
    expect(onStatusChange).toHaveBeenCalledWith("promo-1", "paused");
  });

  it("does not crash on an invalid expiration date", () => {
    render(
      <PromoCodesPanel
        promos={[
          {
            id: "promo-invalid-date",
            code: "ALWAYS10",
            active: true,
            discountType: "percent",
            discountValue: 10,
            expiresAt: "not-a-date",
          },
        ]}
      />,
    );

    expect(screen.getByText("дата не указана")).toBeInTheDocument();
  });
});
