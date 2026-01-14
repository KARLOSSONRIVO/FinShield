import asyncHandler from "../../common/utils/asyncHandler.js";
import * as AuthService from "../services/auth.service.js";

export const login = asyncHandler(async (req, res) => {
  const data = await AuthService.login({ payload: req.body })
  res.json({ ok: true, data })
})

export const me = asyncHandler(async (req, res) => {
  const data = await AuthService.me({ actor: req.auth })
  res.json({ ok: true, data })
})

export const changePassword = asyncHandler(async (req, res) => {
  const data = await AuthService.changePassword({ actor: req.auth, payload: req.body })
  res.json({ ok: true, data })
})