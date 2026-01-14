import asyncHandler from "../../common/utils/asyncHandler.js";
import * as AssignmentServices from "../services/assignment.service.js";

export const createAssignment = asyncHandler(async (req, res) => {
    const assignment = await AssignmentServices.createAssignment({
        actor: req.auth,
        payload: req.body
    });
    res.status(201).json({
        ok: true,
        message: "Assignment created successfully",
        data: assignment
    });
});

export const listAssignments = asyncHandler(async (req, res) => {
    const assignments = await AssignmentServices.listAssignments({ actor: req.auth })
    res.json({ ok: true, data: assignments });
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
        payload: req.body
    });
    res.json({ ok: true, message: "Assignment updated successfully", data: assignment })
});

export const deleteAssignment = asyncHandler(async (req, res) => {
    const result = await AssignmentServices.deleteAssignment({
        actor: req.auth,
        assignmentId: req.params.id
    });
    res.json({ ok: true, message: result.message })
})
