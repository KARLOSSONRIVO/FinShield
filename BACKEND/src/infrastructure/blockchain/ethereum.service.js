import Web3 from "web3";
import { nonceQueue } from "./nonceQueue.js";
import AppError from "../../common/errors/AppErrors.js";
import { CHAIN_RPC_URL, ANCHOR_PRIVATE_KEY, ANCHOR_CONTRACT_ADDRESS } from "../../config/env.js";


const ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "invoiceId", type: "bytes32" },
      { indexed: false, internalType: "string", name: "cid", type: "string" },
      { indexed: true, internalType: "bytes32", name: "fileHash", type: "bytes32" },
      { indexed: false, internalType: "address", name: "uploader", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "InvoiceAnchored",
    type: "event"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "invoiceId", type: "bytes32" },
      { internalType: "string", name: "cid", type: "string" },
      { internalType: "bytes32", name: "fileHash", type: "bytes32" }
    ],
    name: "anchor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const web3 = new Web3(CHAIN_RPC_URL);

// Normalize private key for web3 v4: strip whitespace/quotes, ensure 0x prefix
const _rawPk = String(ANCHOR_PRIVATE_KEY ?? "").trim().replace(/\s+/g, "").replace(/^['"]|['"]$/g, "")
const _pkNo0x = _rawPk.replace(/^0x/i, "")
if (!/^[0-9a-fA-F]{64}$/.test(_pkNo0x)) {
  throw new AppError("ANCHOR_PRIVATE_KEY must be a 64-hex-char string (optionally prefixed with 0x)", 500, "INVALID_PRIVATE_KEY_FORMAT")
}
const _normalizedPk = `0x${_pkNo0x}`

const account = web3.eth.accounts.privateKeyToAccount(_normalizedPk)
web3.eth.accounts.wallet.add(account)
web3.eth.defaultAccount = account.address

const contract = new web3.eth.Contract(ABI, ANCHOR_CONTRACT_ADDRESS)

export function toBytes32FromString(tag, value) {
  return web3.utils.soliditySha3({ type: "string", value: `${tag}:${String(value)}` })
}

export function sha256HexToBytes32(hex) {
  const h = String(hex).toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/.test(h)) throw new AppError("Invalid sha256 hex", 400, "BAD_HASH")
  return "0x" + h;
}

export async function anchorInvoice({ invoiceMongoId, ipfsCid, sha256Hex }) {
  return nonceQueue.enqueue(account.address, async (nonce) => {
    const invoiceId32 = toBytes32FromString("invoice", invoiceMongoId);
    const rawCidString = ipfsCid;
    const fileHash32 = sha256HexToBytes32(sha256Hex);

    const method = contract.methods.anchor(
      invoiceId32,
      rawCidString,
      fileHash32
    );

    const gasEstimate = await method.estimateGas({ from: account.address });
    // Convert gas to string to avoid BigInt mixing issues
    const gas = gasEstimate.toString();

    // 🔑 EIP-1559 fee data
    const block = await web3.eth.getBlock("pending");
    const baseFeePerGas = BigInt(block.baseFeePerGas); // Ensure it's BigInt

    // Priority fee (tip) – safe default
    const maxPriorityFeePerGas = BigInt(web3.utils.toWei("2", "gwei")); // Ensure it's BigInt

    // Max fee = base fee * 2 + tip
    const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas; // Arithmetic between BigInt values

    // Convert nonce to string to avoid BigInt mixing issues
    const nonceStr = nonce.toString();

    // Send the transaction
    const receipt = await method.send({
      from: account.address,
      gas,
      nonce: nonceStr, // 🔑 CONTROLLED NONCE (as string)
      maxFeePerGas: maxFeePerGas.toString(),  // Convert BigInt to string (required by web3)
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(), // Convert BigInt to string (required by web3)
      type: "0x2", // EIP-1559 type
    });

    // Normalize txHash: Web3 v4 may drop leading zeros on bytes32 values,
    // producing a 65-char hash. Always pad to 0x + 64 hex chars.
    const rawHash = String(receipt.transactionHash);
    const txHash = '0x' + rawHash.replace(/^0x/i, '').padStart(64, '0');

    return {
      txHash,
      blockNumber:
        typeof receipt.blockNumber === "bigint"
          ? Number(receipt.blockNumber)
          : receipt.blockNumber,
      from: account.address
    };
  });
}

/**
 * Fetches the IPFS CID string directly from an Ethereum Transaction log
 * @param {string} txHash - The 0x-prefixed transaction hash
 * @returns {Promise<{cid: string, uploader: string, timestamp: number}>}
 */
export async function fetchInvoiceCidFromTx(txHash) {
  try {
    const receipt = await web3.eth.getTransactionReceipt(txHash);

    if (!receipt || !receipt.logs || receipt.logs.length === 0) {
      throw new AppError("Transaction not found or has no logs", 404, "TX_NOT_FOUND");
    }

    // The InvoiceAnchored event is usually the first and only log we emit
    const log = receipt.logs[0];

    // Web3 ABI Decoder for the non-indexed parameters of our InvoiceAnchored event
    // The indexed parameters (invoiceId, fileHash) go into topics, 
    // the rest (cid, uploader, timestamp) go into the data field.
    const decoded = web3.eth.abi.decodeParameters([
      { type: 'string', name: 'cid' },
      { type: 'address', name: 'uploader' },
      { type: 'uint256', name: 'timestamp' }
    ], log.data);

    return {
      cid: decoded.cid,
      uploader: decoded.uploader,
      timestamp: Number(decoded.timestamp)
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Failed to fetch CID from blockchain: ${err.message}`, 500, "BLOCKCHAIN_FETCH_ERROR");
  }
}

