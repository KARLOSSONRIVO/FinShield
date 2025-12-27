import asyncHandler from "../../common/utils/asyncHandler.js";
import * as UserServices from "../services/user.services.js";

export const createUser = asyncHandler(async(req,res)=>{
    const data = await UserServices.createUser({actor: req.auth, payload: req.body});
    res.status(201).json({ok: true, data});
})

export const list = asyncHandler(async(req,res)=>{
    const orgId = req.query.Id
    const data = await UserServices.listUsers({actor: req.auth, orgId});
    res.json({ok: true, data});
})

export const getOne = asyncHandler(async(req,res)=>{
    const data = await UserServices.getUserById({actor: req.auth, userId: req.params.id});
    res.json({ok: true, data});
})

export const update = asyncHandler(async(req,res)=>{
    const updateData = {
        actor: req.auth,
        userId: req.params.id,
        status: req.body.status,
    };
    
    if (req.body.status === "disabled") {
        updateData.reason = req.body.reason;
    }
    
    const data = await UserServices.updateUser(updateData);
    res.json({ ok: true, data });
})