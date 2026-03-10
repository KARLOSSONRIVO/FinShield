import asyncHandler from "../../common/utils/asyncHandler.js";
import * as TermsService from "../services/termsAndConditions.service.js";

function getClientIp(req) {
    return (
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip
    );
}

// POST /terms  → REGULATOR
export const createTerms = asyncHandler(async (req, res) => {
    const data = await TermsService.createTerms({
        actor: req.auth,
        payload: req.body,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({ ok: true, message: "Terms and Conditions created successfully", data });
});

// PATCH /terms/:id  → REGULATOR
export const updateTerms = asyncHandler(async (req, res) => {
    const data = await TermsService.updateTerms({
        actor: req.auth,
        termsId: req.params.id,
        payload: req.body,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.json({ ok: true, message: "Terms and Conditions updated successfully", data });
});

// DELETE /terms/:id  → REGULATOR
export const deleteTerms = asyncHandler(async (req, res) => {
    await TermsService.deleteTerms({
        actor: req.auth,
        termsId: req.params.id,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.json({ ok: true, message: "Terms and Conditions deleted successfully" });
});

// GET /terms  → COMPANY_MANAGER, AUDITOR, COMPANY_USER
export const getTerms = asyncHandler(async (req, res) => {
    const data = await TermsService.getTerms({
        search: req.query.search ?? undefined,
    });
    res.json({ ok: true, data });
});
