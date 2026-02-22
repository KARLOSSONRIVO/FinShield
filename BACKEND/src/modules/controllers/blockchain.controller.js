import asyncHandler from "../../common/utils/asyncHandler.js";
import * as BlockchainService from "../services/blockchain.service.js";

export const getLedger = asyncHandler(async (req, res) => {
    const data = await BlockchainService.getLedger(req.query);
    res.json({ ok: true, data });
});
