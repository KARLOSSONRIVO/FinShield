#!/usr/bin/env node
/**
 * Estimate anchor() gas fee and optional actual on-chain fee.
 *
 * Examples:
 *   node scripts/test_blockchain_gas_fee.js
 *   node scripts/test_blockchain_gas_fee.js --invoice-id INV-2026-001 --cid bafy... --sha <64hex>
 *   node scripts/test_blockchain_gas_fee.js --tx-hash 0x... --eth-price 3200
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Web3 from "web3";

const ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "invoiceId", type: "bytes32" },
      { internalType: "string", name: "cid", type: "string" },
      { internalType: "bytes32", name: "fileHash", type: "bytes32" },
    ],
    name: "anchor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

function loadEnv() {
  // Load .env from likely locations so script works from repo root, BACKEND, or BACKEND/scripts
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile); // .../BACKEND/scripts
  const backendRoot = path.resolve(currentDir, ".."); // .../BACKEND

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(backendRoot, ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, quiet: true });
      return envPath;
    }
  }
  return null;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function normalizePrivateKey(pk) {
  const raw = String(pk || "").trim().replace(/\s+/g, "").replace(/^['"]|['"]$/g, "");
  const no0x = raw.replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{64}$/.test(no0x)) {
    throw new Error("Invalid private key format. Expected 64 hex chars.");
  }
  return `0x${no0x}`;
}

function normalizeSha256ToBytes32(hex) {
  const h = String(hex || "").toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(h)) {
    throw new Error("Invalid sha256 hex. Expected 64 hex chars.");
  }
  return `0x${h}`;
}

function toBytes32FromString(web3, tag, value) {
  return web3.utils.soliditySha3({ type: "string", value: `${tag}:${String(value)}` });
}

function weiToEthString(web3, weiBigInt) {
  return web3.utils.fromWei(weiBigInt.toString(), "ether");
}

function weiToGweiString(web3, weiBigInt) {
  return web3.utils.fromWei(weiBigInt.toString(), "gwei");
}

async function main() {
  const runStartedNs = process.hrtime.bigint();
  loadEnv();
  const args = parseArgs(process.argv);

  const rpcUrl = args.rpc || process.env.CHAIN_RPC_URL;
  const contractAddress = args.contract || process.env.ANCHOR_CONTRACT_ADDRESS;
  const invoiceId = args["invoice-id"] || "sample-invoice-001";
  const cid = args.cid || "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const sha = args.sha || "a".repeat(64);
  const txHash = args["tx-hash"];
  const priorityGwei = Number(args["priority-gwei"] || 2);
  const ethPrice = args["eth-price"] ? Number(args["eth-price"]) : null;

  requireValue("CHAIN_RPC_URL/--rpc", rpcUrl);
  requireValue("ANCHOR_CONTRACT_ADDRESS/--contract", contractAddress);

  const web3 = new Web3(rpcUrl);
  const contract = new web3.eth.Contract(ABI, contractAddress);

  let from = args.from || process.env.ANCHOR_FROM;
  const maybePk = args["private-key"] || process.env.ANCHOR_PRIVATE_KEY;
  if (!from && maybePk) {
    const normalizedPk = normalizePrivateKey(maybePk);
    from = web3.eth.accounts.privateKeyToAccount(normalizedPk).address;
  }
  requireValue("from address (--from or ANCHOR_FROM or ANCHOR_PRIVATE_KEY)", from);

  const invoiceId32 = toBytes32FromString(web3, "invoice", invoiceId);
  const fileHash32 = normalizeSha256ToBytes32(sha);
  const method = contract.methods.anchor(invoiceId32, cid, fileHash32);

  const gasEstimate = BigInt(await method.estimateGas({ from }));
  const pendingBlock = await web3.eth.getBlock("pending");
  const fallbackGasPrice = await web3.eth.getGasPrice();
  const baseFeePerGas = BigInt(pendingBlock.baseFeePerGas || fallbackGasPrice);
  const priorityFeePerGas = BigInt(web3.utils.toWei(String(priorityGwei), "gwei"));

  const likelyFeePerGas = baseFeePerGas + priorityFeePerGas;
  const maxFeePerGas = baseFeePerGas * 2n + priorityFeePerGas;

  const likelyFeeWei = gasEstimate * likelyFeePerGas;
  const maxFeeWei = gasEstimate * maxFeePerGas;

  console.log("Anchor gas estimation:");
  console.log(`  from: ${from}`);
  console.log(`  contract: ${contractAddress}`);
  console.log(`  gas_estimate: ${gasEstimate.toString()} units`);
  console.log(`  base_fee: ${weiToGweiString(web3, baseFeePerGas)} gwei`);
  console.log(`  priority_fee: ${weiToGweiString(web3, priorityFeePerGas)} gwei`);
  console.log(`  estimated_likely_fee: ${weiToEthString(web3, likelyFeeWei)} ETH`);
  console.log(`  estimated_max_fee: ${weiToEthString(web3, maxFeeWei)} ETH`);

  if (ethPrice && Number.isFinite(ethPrice)) {
    const likelyUsd = Number(weiToEthString(web3, likelyFeeWei)) * ethPrice;
    const maxUsd = Number(weiToEthString(web3, maxFeeWei)) * ethPrice;
    console.log(`  estimated_likely_fee_usd: $${likelyUsd.toFixed(4)}`);
    console.log(`  estimated_max_fee_usd: $${maxUsd.toFixed(4)}`);
  }

  console.log("\nResults:");
  const reasons = [];
  if (gasEstimate > 200000n) {
    reasons.push(`gas estimate ${gasEstimate.toString()} exceeded threshold 200000`);
    console.log("  WARN: High gas usage estimate. Check contract storage writes and string length (CID).");
  }
  if (baseFeePerGas > BigInt(web3.utils.toWei("50", "gwei"))) {
    reasons.push(`base fee ${weiToGweiString(web3, baseFeePerGas)} gwei exceeded threshold 50 gwei`);
    console.log("  WARN: Network base fee is high. Transaction timing may be expensive.");
  }
  const detected = reasons.length > 0;
  if (!detected) {
    console.log("  OK: No obvious gas bottleneck from estimate.");
  }
  const totalRuntimeMs = Number(process.hrtime.bigint() - runStartedNs) / 1_000_000;
  const throughput = totalRuntimeMs > 0 ? 1000 / totalRuntimeMs : 0;
  console.log(
    `  final_speed=total_runtime:${totalRuntimeMs.toFixed(2)}ms, throughput:${throughput.toFixed(2)} calculations/s`
  );

  if (!txHash) return;

  const receipt = await web3.eth.getTransactionReceipt(txHash);
  if (!receipt) {
    console.log(`\nNo receipt found yet for tx hash: ${txHash}`);
    return;
  }

  const tx = await web3.eth.getTransaction(txHash);
  const gasUsed = BigInt(receipt.gasUsed);
  const effectiveGasPrice = receipt.effectiveGasPrice
    ? BigInt(receipt.effectiveGasPrice)
    : BigInt(tx.gasPrice);
  const actualFeeWei = gasUsed * effectiveGasPrice;

  console.log("\nActual transaction fee:");
  console.log(`  tx_hash: ${txHash}`);
  console.log(`  gas_used: ${gasUsed.toString()} units`);
  console.log(`  effective_gas_price: ${weiToGweiString(web3, effectiveGasPrice)} gwei`);
  console.log(`  actual_fee: ${weiToEthString(web3, actualFeeWei)} ETH`);

  if (ethPrice && Number.isFinite(ethPrice)) {
    const actualUsd = Number(weiToEthString(web3, actualFeeWei)) * ethPrice;
    console.log(`  actual_fee_usd: $${actualUsd.toFixed(4)}`);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
