import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Docker installs stable Google Chrome on AMD64 without forcing every build to AMD64", async () => {
  const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");

  assert.doesNotMatch(dockerfile, /^FROM --platform=/mu);
  assert.match(dockerfile, /^ARG TARGETARCH$/mu);
  assert.match(dockerfile, /if \[ "\$TARGETARCH" = "amd64" \]/u);
  assert.match(dockerfile, /https:\/\/dl\.google\.com\/linux\/linux_signing_key\.pub/u);
  assert.match(dockerfile, /--proto '=https' --proto-redir '=https'/u);
  assert.match(dockerfile, /EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796/u);
  assert.match(dockerfile, /gpg\s+--batch[^\n]*--export EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796/u);
  assert.doesNotMatch(dockerfile, /--dearmor/u);
  assert.match(dockerfile, /signed-by=\/usr\/share\/keyrings\/google-chrome\.gpg/u);
  assert.doesNotMatch(dockerfile, /apt-key/u);
  assert.match(dockerfile, /https:\/\/dl\.google\.com\/linux\/chrome\/deb\//u);
  assert.match(dockerfile, /apt-get install[^\n]*google-chrome-stable/u);
});

test("startup selects Google Chrome when present and Playwright Chromium otherwise", async () => {
  const startup = await readFile(new URL("../start.sh", import.meta.url), "utf8");

  assert.match(startup, /\/usr\/bin\/google-chrome/u);
  assert.match(startup, /find \/ms-playwright/u);
  assert.match(startup, /BROWSER_EXECUTABLE_PATH/u);
});

test("startup passes the configured Chrome executable to the browser manager", async () => {
  const startup = await readFile(new URL("../src/start.js", import.meta.url), "utf8");

  assert.match(startup, /executablePath:\s*config\.browserExecutablePath/u);
});
