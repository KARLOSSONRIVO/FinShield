import { anchorInvoice } from "../../../infrastructure/blockchain/ethereum.service.js";
import * as InvoiceRepositories from "../../repositories/invoice.repositories.js";
import { triggerOcr } from "../../../infrastructure/ai/ocr_client.js";
import { unpinByCid } from "../../../infrastructure/storage/ipfs.service.js";

/* ============================X
 * BACKGROUND ANCHOR
 * ============================ */
export async function anchorInvoiceInBackground(invoiceId, ipfsCid, fileSha, allowAutoOcr) {
    try {
        const anchored = await anchorInvoice({
            invoiceMongoId: invoiceId,
            ipfsCid,
            sha256Hex: fileSha,
        });

        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorTxHash: anchored.txHash,
            anchorBlockNumber: anchored.blockNumber,
            anchoredAt: new Date(),
            anchorStatus: "anchored",
        });

        // ✅ OCR ONLY FOR DOCUMENTS
        if (allowAutoOcr) {
            triggerOcr(invoiceId).catch((e) => {
                console.error(`❌ OCR trigger failed for ${invoiceId}:`, e?.message || e);
            });
        }

        console.log(`✅ Invoice ${invoiceId} anchored: ${anchored.txHash}`);
    } catch (e) {
        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorStatus: "failed",
            anchorError: e?.message || "Anchor failed",
        });

        // 🗑️ Remove file from IPFS when anchoring fails
        try {
            await unpinByCid(ipfsCid);

            // ✅ Set ipfsCid and fileHashSha256 to null after successful unpin
            await InvoiceRepositories.updateInvoice(invoiceId, { ipfsCid: null, fileHashSha256: null });
        } catch (ipfsError) {
            console.error(`⚠️ Failed to remove IPFS file ${ipfsCid}:`, ipfsError.message);
        }

        console.error(`❌ Anchor failed for ${invoiceId}:`, e.message);
    }
}
