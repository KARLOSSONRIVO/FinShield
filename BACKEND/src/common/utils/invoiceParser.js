/**
 * Invoice number extraction utilities
 * Used for duplicate detection before full OCR processing
 */

/**
 * Extract invoice number from text using common patterns
 * @param {string} text - OCR extracted text
 * @returns {string|null} - Extracted invoice number or null
 */
export function extractInvoiceNumber(text) {
    if (!text || typeof text !== 'string') return null;
    
    // Common invoice number patterns
    const patterns = [
        // "Invoice Number: 12345" or "Invoice No: 12345"
        /invoice\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
        
        // "No: 12345" or "No. 12345"
        /\bno\.?\s*[:\-]?\s*([A-Z0-9\-]+)/i,
        
        // "Invoice: INV-2024-001"
        /invoice[:\s]+([A-Z0-9\-]+)/i,
        
        // "#12345" or "# 12345"
        /#\s*([A-Z0-9\-]{3,})/i,
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const invoiceNum = match[1].trim();
            // Ensure it's at least 3 characters and not a common word
            if (invoiceNum.length >= 3 && !['invoice', 'number', 'date'].includes(invoiceNum.toLowerCase())) {
                return invoiceNum;
            }
        }
    }
    
    return null;
}
