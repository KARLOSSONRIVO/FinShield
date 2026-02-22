import asyncHandler from "../../common/utils/asyncHandler.js";
import * as OrganizationServices from "../services/organization.service.js";

export const createOrganization = asyncHandler(async (req, res) => {
    const org = await OrganizationServices.createOrganization({
        actor: req.auth,
        payload: req.body,
        file: req.file
    })
    res.status(201).json({
        ok: true,
        message: "Organization created successfully",
        data: org
    })
})

export const listOrganizations = asyncHandler(async (req, res) => {
    const data = await OrganizationServices.listOrganizations({ actor: req.auth, query: req.query })
    res.json({ ok: true, data })
})

export const getOneOrganization = asyncHandler(async (req, res) => {
    const org = await OrganizationServices.getOrganizationById({
        actor: req.auth,
        orgId: req.params.id
    })
    res.json({ ok: true, data: org })
})