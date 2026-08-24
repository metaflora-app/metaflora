import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const railwayConfigUrl = new URL("../railway.json", import.meta.url);

test("Railway installs Playwright Chromium inside the runtime application image", async () => {
  const config = JSON.parse(await readFile(fileURLToPath(railwayConfigUrl), "utf8"));
  const command = String(config?.build?.buildCommand ?? "");

  assert.match(command, /PLAYWRIGHT_BROWSERS_PATH=0/u);
  assert.match(command, /playwright install --with-deps chromium/u);
});
