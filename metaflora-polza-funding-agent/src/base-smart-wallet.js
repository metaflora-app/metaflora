import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
import {
  createPublicClient, encodePacked, erc20Abi, getContract, hexToBigInt,
  http, maxUint256, parseErc6492Signature
} from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const CIRCLE_PAYMASTER_V07 = "0x6C973eBe80dCD8660841D4356bf15c32460271C9";
const ADDRESS = /^0x[a-fA-F0-9]{40}$/u;
const PRIVATE_KEY = /^0x[a-fA-F0-9]{64}$/u;
const HASH = /^0x[a-fA-F0-9]{64}$/u;
const PERMIT_AMOUNT = 10_000_000n;
const eip2612Abi = [...erc20Abi,
  { inputs: [{ name: "owner", type: "address" }], name: "nonces", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "version", outputs: [{ type: "string" }], stateMutability: "view", type: "function" }
];

function exactAmount(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new TypeError("USDC amount is invalid");
  return number;
}

async function signPermit({ token, client, account }) {
  const permit = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" }, { name: "version", type: "string" },
        { name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" }
      ],
      Permit: [
        { name: "owner", type: "address" }, { name: "spender", type: "address" },
        { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    },
    primaryType: "Permit",
    domain: { name: await token.read.name(), version: await token.read.version(), chainId: base.id, verifyingContract: BASE_USDC },
    message: {
      owner: account.address, spender: CIRCLE_PAYMASTER_V07,
      value: PERMIT_AMOUNT.toString(), nonce: (await token.read.nonces([account.address])).toString(),
      deadline: maxUint256.toString()
    }
  };
  const wrapped = await account.signTypedData(permit);
  const valid = await client.verifyTypedData({ ...permit, address: account.address, signature: wrapped });
  if (!valid) throw new Error("Circle Paymaster permit verification failed");
  return parseErc6492Signature(wrapped).signature;
}

async function defaultRuntime({ ownerPrivateKey, rpcUrl, bundlerUrl }) {
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  const owner = privateKeyToAccount(ownerPrivateKey);
  const account = await toCircleSmartAccount({ client, owner });
  const usdc = getContract({ client, address: BASE_USDC, abi: eip2612Abi });
  const paymaster = {
    async getPaymasterData() {
      const signature = await signPermit({ token: usdc, client, account });
      return {
        paymaster: CIRCLE_PAYMASTER_V07,
        paymasterData: encodePacked(["uint8", "address", "uint256", "bytes"], [0, BASE_USDC, PERMIT_AMOUNT, signature]),
        paymasterVerificationGasLimit: 200_000n, paymasterPostOpGasLimit: 15_000n, isFinal: true
      };
    }
  };
  const bundler = createBundlerClient({
    account, client, paymaster, transport: http(bundlerUrl),
    userOperation: { estimateFeesPerGas: async ({ bundlerClient }) => {
      const { standard: fees } = await bundlerClient.request({ method: "pimlico_getUserOperationGasPrice" });
      return { maxFeePerGas: hexToBigInt(fees.maxFeePerGas), maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas) };
    } }
  });
  return {
    account,
    usdc: { balanceOf: () => usdc.read.balanceOf([account.address]) },
    async send(transfers) {
      const hash = await bundler.sendUserOperation({ account, calls: transfers.map((item) => ({
        to: BASE_USDC, abi: erc20Abi, functionName: "transfer", args: [item.recipient, item.amount]
      })) });
      const receipt = await bundler.waitForUserOperationReceipt({ hash, timeout: 180_000 });
      return { userOperationHash: hash, transactionHash: receipt.receipt.transactionHash };
    }
  };
}

export async function createBaseSmartWallet({
  ownerPrivateKey,
  rpcUrl = "https://mainnet.base.org",
  bundlerUrl = `https://public.pimlico.io/v2/${base.id}/rpc`,
  createRuntime = defaultRuntime
} = {}) {
  if (!PRIVATE_KEY.test(String(ownerPrivateKey ?? ""))) throw new TypeError("Base smart wallet owner private key is invalid");
  const runtime = await createRuntime({ ownerPrivateKey, rpcUrl, bundlerUrl });
  if (!ADDRESS.test(String(runtime?.account?.address ?? ""))) throw new Error("Base smart wallet address is unavailable");
  const inFlight = new Map();
  return Object.freeze({
    address: runtime.account.address,
    chain: "base", gasAsset: "USDC",
    async getUsdcBalanceMicros() {
      const value = await runtime.usdc.balanceOf();
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < 0) throw new Error("Base USDC balance is invalid");
      return number;
    },
    async transferUsdc({ recipient, amountUsdcMicros, idempotencyKey }) {
      return this.transferUsdcBatch({ transfers: [{ recipient, amountUsdcMicros }], idempotencyKey });
    },
    async transferUsdcBatch({ transfers, idempotencyKey }) {
      if (!Array.isArray(transfers) || transfers.length < 1 || transfers.length > 8) {
        throw new TypeError("USDC transfers are invalid");
      }
      const normalized = transfers.map(({ recipient, amountUsdcMicros }) => {
        if (!ADDRESS.test(String(recipient ?? ""))) throw new TypeError("USDC recipient is invalid");
        return Object.freeze({ recipient, amount: exactAmount(amountUsdcMicros) });
      });
      const amount = normalized.reduce((total, item) => total + item.amount, 0);
      if (!Number.isSafeInteger(amount)) throw new TypeError("USDC transfer total is invalid");
      const key = String(idempotencyKey ?? "").trim();
      if (!key || key.length > 255) throw new TypeError("idempotencyKey is invalid");
      if (inFlight.has(key)) return inFlight.get(key);
      const promise = (async () => {
        if (await this.getUsdcBalanceMicros() < amount) throw new Error("Insufficient Base USDC balance");
        const result = await runtime.send(normalized.map((item) => ({
          token: BASE_USDC, recipient: item.recipient, amount: BigInt(item.amount)
        })));
        if (!HASH.test(String(result?.transactionHash ?? ""))) throw new Error("Base payout receipt is invalid");
        return Object.freeze(result);
      })();
      inFlight.set(key, promise);
      try { return await promise; } finally { inFlight.delete(key); }
    }
  });
}
