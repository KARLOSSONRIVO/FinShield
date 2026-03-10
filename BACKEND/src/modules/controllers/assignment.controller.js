import asyncHandler from "../../common/utils/asyncHandler.js";
import * as AssignmentServices from "../services/assignment.service.js";

function getClientIp(req) {
    return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip;
}

export const createAssignment = asyncHandler(async (req, res) => {
    const assignment = await AssignmentServices.createAssignment({
        actor: req.auth,
        payload: req.body,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({
        ok: true,
        message: "Assignment created successfully",
        data: assignment
    });
});

export const listAssignments = asyncHandler(async (req, res) => {
    const data = await AssignmentServices.listAssignments({ actor: req.auth, query: req.query })
    res.json({ ok: true, data });
});

export const getAssignmentById = asyncHandler(async (req, res) => {
    const assignment = await AssignmentServices.getAssignmentById({
        actor: req.auth,
        assignmentId: req.params.id
    });
    res.json({ ok: true, data: assignment })
});

export const updateAssignment = asyncHandler(async (req, res) => {
    const assignment = await AssignmentServices.updateAssignment({
        actor: req.auth,
        assignmentId: req.params.id,
        payload: req.body,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.json({ ok: true, message: "Assignment updated successfully", data: assignment })
});

export const deleteAssignment = asyncHandler(async (req, res) => {
    const result = await AssignmentServices.deleteAssignment({
        actor: req.auth,
        assignmentId: req.params.id,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
    });
    res.json({ ok: true, message: result.message })
})
