import { NODE_ENV } from "../../../config/env.js";

export function healthcheck(req, res) {
    res.status(200).json({
        ok: true,
        env: NODE_ENV,
        time: new Date().toISOString()
    });
}