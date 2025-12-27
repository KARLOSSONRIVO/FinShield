import asyncHandler from "../../common/utils/asyncHandler.js";
import * as OrganizationServices from "../services/organization.service.js";

export const createOrganization = asyncHandler(async (req, res) => {
    const org  = await OrganizationServices.createOrganization({
        actor: req.auth,
        payload: req.body
    })
    res.status(201).json({
        ok: true,
        message: "Organization created successfully",
        data: org
    })
})

export const listOrganizations = asyncHandler (async(req,res)=>{
    const orgs = await OrganizationServices.listOrganizations({actor:req.auth})
    res.json({ok:true, data:orgs})
})

export const getOneOrganization = asyncHandler(async(req,res)=>{
    const org = await OrganizationServices.getOrganizationById({
        actor: req.auth,
        orgId: req.params.id
    })
    res.json({ok:true, data:org})
})