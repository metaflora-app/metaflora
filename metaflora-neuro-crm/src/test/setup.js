import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  if (typeof document !== "undefined") cleanup();
  if (
    typeof window !== "undefined" &&
    typeof window.localStorage?.clear === "function"
  ) {
    window.localStorage.clear();
  }
  if (
    typeof window !== "undefined" &&
    typeof window.sessionStorage?.clear === "function"
  ) {
    window.sessionStorage.clear();
  }
});
