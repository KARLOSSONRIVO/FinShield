import Invoice from "../models/invoice.model.js";

export async function createInvoice(data) {
    return Invoice.create(data);
}