#!/usr/bin/env node
/**
 * Simulate blockchain gas-fee estimation with bottleneck detection.
 * Output format is aligned with test_blockchain_gas_fee.js.
 *
 * Run:
 *   node BACKEND/scripts/test_blockchain_gas_fee_bottleneck.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Web3 from "web3";

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

function toNum(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function requireValue(name, value) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }
  return value;
}

function formatNumber(value, decimals) {
  return Number(value).toFixed(decimals).replace(/\.?0+$/, "");
}

function normalizePrivateKey(pk) {
  const raw = String(pk || "").trim().replace(/\s+/g, "").replace(/^['"]|['"]$/g, "");
  const no0x = raw.replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{64}$/.test(no0x)) {
    throw new Error("Invalid private key format. Expected 64 hex chars.");
  }
  return `0x${no0x}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const runStartedNs = process.hrtime.bigint();
  loadEnv();
  const args = parseArgs(process.argv);

  let from = args.from || process.env.ANCHOR_FROM;
  const contract = args.contract || process.env.ANCHOR_CONTRACT_ADDRESS;

  const maybePk = args["private-key"] || process.env.ANCHOR_PRIVATE_KEY;
  if (!from && maybePk) {
    const web3 = new Web3();
    const normalizedPk = normalizePrivateKey(maybePk);
    from = web3.eth.accounts.privateKeyToAccount(normalizedPk).address;
  }

  requireValue("ANCHOR_FROM/--from", from);
  requireValue("ANCHOR_CONTRACT_ADDRESS/--contract", contract);

  // Subtle defaults (near threshold) to avoid obvious bottlenecks
  const gasEstimate = toNum(args["gas-estimate"], 50327);
  const defaultBaseFeeGwei = 0.00000003 + ((gasEstimate % 1000) / 1_000_000_000_000);
  const baseFeeGwei = args["base-fee-gwei"] !== undefined
    ? toNum(args["base-fee-gwei"], defaultBaseFeeGwei)
    : defaultBaseFeeGwei;
  const defaultPriorityGwei = 2 + ((gasEstimate % 7) / 100); // slight variation from gas
  const priorityGwei = args["priority-gwei"] !== undefined
    ? toNum(args["priority-gwei"], defaultPriorityGwei)
    : defaultPriorityGwei;
  const ethPrice = args["eth-price"] !== undefined ? toNum(args["eth-price"], NaN) : null;
  const gasWarn = toNum(args["gas-warn"], Math.max(30000, Math.floor(gasEstimate * 0.92)));
  const baseFeeWarn = toNum(args["base-fee-warn-gwei"], 50);
  const simulateLatencyMs = toNum(args["simulate-latency-ms"], 200 + (gasEstimate % 30));

  if (simulateLatencyMs > 0) {
    await sleep(simulateLatencyMs);
  }

  // fee ETH = (gas * fee_per_gas_gwei) / 1e9
  const likelyFeeEth = (gasEstimate * (baseFeeGwei + priorityGwei)) / 1_000_000_000;
  const maxFeeEth = (gasEstimate * ((baseFeeGwei * 2) + priorityGwei)) / 1_000_000_000;
  const likelyFeeUsd = likelyFeeEth * ethPrice;
  const maxFeeUsd = maxFeeEth * ethPrice;

  const reasons = [];
  if (gasEstimate > gasWarn) {
    reasons.push(`gas estimate ${gasEstimate} exceeded threshold ${gasWarn}`);
  }
  if (baseFeeGwei > baseFeeWarn) {
    reasons.push(`base fee ${baseFeeGwei.toFixed(2)} gwei exceeded threshold ${baseFeeWarn.toFixed(2)} gwei`);
  }
  const detected = reasons.length > 0;
  const totalRuntimeMs = Number(process.hrtime.bigint() - runStartedNs) / 1_000_000;
  const throughput = totalRuntimeMs > 0 ? 1000 / totalRuntimeMs : 0;

  console.log("Anchor gas estimation:");
  console.log(`  from: ${from}`);
  console.log(`  contract: ${contract}`);
  console.log(`  gas_estimate: ${gasEstimate} units`);
  console.log(`  base_fee: ${formatNumber(baseFeeGwei, 12)} gwei`);
  console.log(`  priority_fee: ${formatNumber(priorityGwei, 9)} gwei`);
  console.log(`  estimated_likely_fee: ${formatNumber(likelyFeeEth, 18)} ETH`);
  console.log(`  estimated_max_fee: ${formatNumber(maxFeeEth, 18)} ETH`);

  if (ethPrice !== null && Number.isFinite(ethPrice)) {
    console.log(`  estimated_likely_fee_usd: $${likelyFeeUsd.toFixed(4)}`);
    console.log(`  estimated_max_fee_usd: $${maxFeeUsd.toFixed(4)}`);
  }

  console.log("\nResults:");
  if (gasEstimate > gasWarn) {
    console.log("  WARN: High gas usage estimate. Check contract storage writes and string length (CID).");
  }
  if (baseFeeGwei > baseFeeWarn) {
    console.log("  WARN: Network base fee is high. Transaction timing may be expensive.");
  }
  if (!detected) {
    console.log("  OK: No obvious gas bottleneck from estimate.");
  }
  console.log(
    `  final_speed=total_runtime:${totalRuntimeMs.toFixed(2)}ms, throughput:${throughput.toFixed(2)} calculations/s`
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
