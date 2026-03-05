import asyncHandler from "../../common/utils/asyncHandler.js";
import * as PolicyService from "../services/policy.service.js";

function getClientIp(req) {
    return (
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip
    );
}

// POST /policy  → REGULATOR
export const createPolicy = asyncHandler(async (req, res) => {
    const data = await PolicyService.createPolicy({
        actor: req.auth,
        payload: req.body,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({ ok: true, message: "Policy created successfully", data });
});

// PATCH /policy/:id  → REGULATOR
export const updatePolicy = asyncHandler(async (req, res) => {
    const data = await PolicyService.updatePolicy({
        actor: req.auth,
        policyId: req.params.id,
        payload: req.body,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.json({ ok: true, message: "Policy updated successfully", data });
});

// DELETE /policy/:id  → REGULATOR
export const deletePolicy = asyncHandler(async (req, res) => {
    await PolicyService.deletePolicy({
        actor: req.auth,
        policyId: req.params.id,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.json({ ok: true, message: "Policy deleted successfully" });
});

// GET /policy  → REGULATOR, COMPANY_MANAGER, COMPANY_USER
export const getPolicies = asyncHandler(async (req, res) => {
    const data = await PolicyService.getPolicies();
    res.json({ ok: true, data });
});
