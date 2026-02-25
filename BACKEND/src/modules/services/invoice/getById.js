import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toInvoiceDetail } from "../../mappers/invoice.mapper.js";
import { fetchInvoiceCidFromTx } from "../../../infrastructure/blockchain/ethereum.service.js";
import Assignment from "../../models/assignment.model.js";
import AppError from "../../../common/errors/AppErrors.js";
import { cacheGet, cacheSet } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

/**
 * Get a single invoice's full detail with role-based access control.
 *
 * SUPER_ADMIN / REGULATOR  → any invoice
 * AUDITOR                  → invoice org must be in their active assignments
 * COMPANY_MANAGER          → invoice org must match actor.orgId
 * COMPANY_USER             → invoice must be uploaded by actor
 */
export async function getInvoiceDetail({ actor, invoiceId }) {
    const doc = await InvoiceRepository.findByIdWithDetails(invoiceId);

    if (!doc) {
        throw new AppError("Invoice not found", 404);
    }

    // Resolve the orgId for comparison (could be populated object or raw ObjectId)
    const invoiceOrgId = doc.orgId?._id
        ? String(doc.orgId._id)
        : String(doc.orgId);

    switch (actor.role) {
        case "SUPER_ADMIN":
        case "REGULATOR":
            // unrestricted
            break;

        case "AUDITOR": {
            const assignment = await Assignment.findOne({
                auditorUserId: actor.sub,
                companyOrgId: invoiceOrgId,
                status: "active",
            }).lean();

            if (!assignment) {
                throw new AppError("Invoice not found", 404);
            }
            break;
        }

        case "COMPANY_MANAGER":
            if (invoiceOrgId !== String(actor.orgId)) {
                throw new AppError("Invoice not found", 404);
            }
            break;

        case "COMPANY_USER":
            if (String(doc.uploadedByUserId) !== String(actor.sub)) {
                throw new AppError("Invoice not found", 404);
            }
            break;

        default:
            throw new AppError("Invoice not found", 404);
    }

    // Check cache for the fully-built detail (post access-control)
    const cacheKey = `${CachePrefix.INV_DETAIL}${invoiceId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    // Fetch IPFS CID from blockchain if the invoice has been anchored
    // (fetchInvoiceCidFromTx has its own permanent cache for the RPC call)
    let ipfsCid = null;
    if (doc.anchorTxHash) {
        try {
            const txData = await fetchInvoiceCidFromTx(doc.anchorTxHash);
            ipfsCid = txData.cid;
        } catch {
            // If blockchain fetch fails, still return the invoice without CID
            ipfsCid = null;
        }
    }

    const result = toInvoiceDetail(doc, { ipfsCid });
    await cacheSet(cacheKey, result, CacheTTL.INV_DETAIL);
    return result;
}
