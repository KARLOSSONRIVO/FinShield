import Web3 from "web3";
import AppError from "../../common/errors/AppErrors.js";
import { CHAIN_RPC_URL, ANCHOR_PRIVATE_KEY, ANCHOR_CONTRACT_ADDRESS , ANCHOR_CONFIRMATION} from "../../config/env.js";

const ABI = [
    {
        anonymous: false,
            inputs:[
                { indexed: true, internalType: "bytes32", name: "invoiceId", type: "bytes32" },
                { indexed: true, internalType: "bytes32", name: "cidHash", type: "bytes32" },
                { indexed: true, internalType: "bytes32", name: "fileHash", type: "bytes32" },
                { indexed: false, internalType: "address", name: "uploader", type: "address" },
                { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
            ],
            name:"InvoiceAnchored",
            type:"event"
    },
    {
        inputs: [
            { internalType: "bytes32", name: "invoiceId", type: "bytes32" },
            { internalType: "bytes32", name: "cidHash", type: "bytes32" },
            { internalType: "bytes32", name: "fileHash", type: "bytes32" },
        ],
        name: "anchor",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
]

const web3 = new Web3(CHAIN_RPC_URL)

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


/**
 * Deterministic bytes32 for identifiers (Mongo ObjectId, etc.)
 * - avoids pushing raw IDs on-chain
 */
export function toBytes32FromString(tag, value) {
    return web3.utils.soliditySha3({ type: "string", value: `${tag}:${String(value)}` })
  }

/**
 * sha256 hex (64 chars) -> bytes32 (0x + 64 hex)
 */
export function sha256HexToBytes32(hex) {
    const h = String(hex).toLowerCase().replace(/^0x/, "");
    if (!/^[0-9a-f]{64}$/.test(h)) throw new AppError("Invalid sha256 hex", 400, "BAD_HASH")
    return "0x" + h;
  }


export async function anchorInvoice({ invoiceMongoId, ipfsCid, sha256Hex }){
    const invoiceId32 = toBytes32FromString("invoice", invoiceMongoId)
    const cidHash32 = toBytes32FromString("cid",ipfsCid)
    const fileHash32 = sha256HexToBytes32(sha256Hex)


const method = contract.methods.anchor(invoiceId32, cidHash32, fileHash32)

const gas = await method.estimateGas({from: account.address})
const gasPrice = await web3.eth.getGasPrice()

const receipt = await method.send({
    from: account.address,
    gas: gas,
    gasPrice: gasPrice,
})

const confs = Number(ANCHOR_CONFIRMATION|| 1)

if(confs>1){
    const startBlock = receipt.blockNumber
    while(true){
        const latest = await web3.eth.getBlockNumber()
        if(latest - startBlock + 1 >= confs){
            break;
        }
        await new Promise((r) => setTimeout(r, 3000))
    }
}
    
return{
    txHash: receipt.transactionHash,
    blockNumber: typeof receipt.blockNumber === "bigint" ? Number(receipt.blockNumber) : receipt.blockNumber,
    from: account.address
}
}