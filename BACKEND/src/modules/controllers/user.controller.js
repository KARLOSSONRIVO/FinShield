import asyncHandler from "../../common/utils/asyncHandler.js";
import * as UserServices from "../services/user.service.js";

export const createUser = asyncHandler(async(req,res)=>{
    await UserServices.createUser({actor: req.auth, payload: req.body})
    res.status(201).json({ok: true, message: "User created successfully"})
})

export const list = asyncHandler(async(req,res)=>{
    const orgId = req.query.orgId
    const data = await UserServices.listUsers({actor: req.auth, orgId, query: req.query})
    res.json({ok: true, data})
})

export const listEmployees = asyncHandler(async(req,res)=>{
    const data = await UserServices.listEmployees({actor: req.auth, query: req.query})
    res.json({ok: true, data})
})

export const getOne = asyncHandler(async(req,res)=>{
    const data = await UserServices.getUserById({actor: req.auth, userId: req.params.id})
    res.json({ok: true, data})
})

export const update = asyncHandler(async(req,res)=>{
    const updateData = {
        actor: req.auth,
        userId: req.params.id,
        status: req.body.status,
    }
    
    if (req.body.status === "disabled") {
        updateData.reason = req.body.reason
    }
    await UserServices.updateUser(updateData)
    res.json({ ok: true, message: "User updated successfully" })
})