import axios from "axios";
import FormData from "form-data";
import { AI_SERVICE_URL } from "../../config/env.js";

export async function runInvoicePrecheck(file) {
    const form = new FormData();
    form.append("file", file.buffer, file.originalname);

    const res = await axios.post(
        `${AI_SERVICE_URL}/precheck`,
        form,
        {
            headers: form.getHeaders(),
            timeout: 30_000,
        }
    );

    return res.data;
}
