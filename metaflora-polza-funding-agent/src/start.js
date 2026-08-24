import { loadConfig } from "./config.js";
import { createMcpClient } from "./mcp.js";
import { BrowserManager } from "./browser.js";
import { GptunnelBrowserManager } from "./gptunnel-browser.js";
import { RouterAiBrowserManager } from "./routerai-browser.js";
import { OpenRouterBrowserManager } from "./openrouter-browser.js";
import { createServer } from "./http.js";
import { StateStore } from "./state-store.js";
import { createBaseSmartWallet } from "./base-smart-wallet.js";
import { createCryptoUsdcSettlementManager } from "./crypto-usdc-settlement.js";

const config = loadConfig();
const mcp = createMcpClient({ endpoint: config.mcpEndpoint, token: config.mcpToken });
const stateStore = new StateStore(config.profileDir);
await stateStore.load();
const browser = new BrowserManager({
  profileDir: config.profileDir,
  executablePath: config.browserExecutablePath,
  dashboardUrl: config.dashboardUrl,
  mcp,
  stateStore,
  allowedPaymentHosts: config.allowedPaymentHosts,
  transactionTimeoutMs: config.transactionTimeoutMs
});
await browser.start();
const gptunnelBrowser = config.gptunnelEnabled
  ? new GptunnelBrowserManager({
    context: browser.context,
    profileUrl: config.gptunnelProfileUrl,
    stateStore,
    transactionTimeoutMs: config.transactionTimeoutMs
  })
  : null;
if (gptunnelBrowser) await gptunnelBrowser.start();
const routerAiBrowser = config.routerAiEnabled
  ? new RouterAiBrowserManager({
    context: browser.context,
    billingUrl: config.routerAiBillingUrl,
    stateStore,
    transactionTimeoutMs: config.transactionTimeoutMs
  })
  : null;
if (routerAiBrowser) await routerAiBrowser.start();
const openRouterBrowser = config.openRouterEnabled
  ? new OpenRouterBrowserManager({
    context: browser.context,
    creditsUrl: config.openRouterCreditsUrl,
    stateStore,
    managementKey: config.openRouterManagementKey,
    liveChargingEnabled: config.openRouterLiveChargingEnabled,
    transactionTimeoutMs: config.transactionTimeoutMs
  })
  : null;
if (openRouterBrowser) await openRouterBrowser.start();
const baseSmartWallet = config.cryptoDirectSettlementEnabled
  ? await createBaseSmartWallet({
    ownerPrivateKey: config.baseSmartWalletOwnerPrivateKey,
    rpcUrl: config.baseRpcUrl,
    bundlerUrl: config.baseBundlerUrl
  })
  : null;
const cryptoSettlement = baseSmartWallet && openRouterBrowser
  ? createCryptoUsdcSettlementManager({
    openRouter: openRouterBrowser,
    smartWallet: baseSmartWallet,
    ownerAddress: config.cryptoOwnerPayoutAddress
  })
  : null;
const providers = Object.freeze({
  polza: Object.freeze({ browser, ledger: mcp }),
  ...(gptunnelBrowser ? { gptunnel: Object.freeze({ browser: gptunnelBrowser, ledger: gptunnelBrowser }) } : {}),
  ...(routerAiBrowser ? { routerai: Object.freeze({ browser: routerAiBrowser, ledger: routerAiBrowser }) } : {}),
  ...(openRouterBrowser ? { openrouter: Object.freeze({ browser: openRouterBrowser, ledger: openRouterBrowser }) } : {})
});
const server = createServer({ config, browser, mcp, providers, cryptoSettlement });
server.listen(config.port, "0.0.0.0", () => process.stdout.write(`funding-agent listening on ${config.port}\n`));

async function shutdown() {
  server.close();
  await browser.context?.close().catch(() => null);
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
