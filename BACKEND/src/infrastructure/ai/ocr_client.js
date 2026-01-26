import axios from "axios";
import { AI_SERVICE_URL } from "../../config/env.js";

export async function triggerOcr(invoiceId) {
  await axios.post(`${AI_SERVICE_URL}/ocr/${invoiceId}`, {}, { timeout: 60_000 });
}
