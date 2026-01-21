import {Router } from "express";
import { healthcheck } from "../../modules/controllers/health/health.controller.js";
const healthRoutes = Router()

healthRoutes.get("/", healthcheck)

export default healthRoutes