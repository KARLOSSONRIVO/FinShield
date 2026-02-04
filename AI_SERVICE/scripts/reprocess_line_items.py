"""
Re-process line items for existing invoices with the fixed parser

This script re-parses all invoices that have OCR text to fix any
line items that were extracted with the old buggy parser.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.engines.anomaly.line_item_parser import LineItemParser


async def reprocess_invoices():
    """Re-parse line items for all invoices with OCR text"""
    
    print("\n" + "="*60)
    print("🔄 Re-processing Invoice Line Items")
    print("="*60 + "\n")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]
    
    try:
        # Find all invoices with OCR text
        cursor = db.invoices.find({
            "ocrText": {"$exists": True, "$ne": None}
        })
        
        invoices = await cursor.to_list(length=None)
        
        if not invoices:
            print("❌ No invoices found with OCR text")
            return
        
        print(f"📊 Found {len(invoices)} invoices to process\n")
        
        parser = LineItemParser()
        updated_count = 0
        error_count = 0
        
        for idx, invoice in enumerate(invoices, 1):
            invoice_id = str(invoice['_id'])
            org_id = invoice.get('orgId') or invoice.get('organizationId')
            
            print(f"[{idx}/{len(invoices)}] Processing {invoice_id}...")
            
            try:
                # Parse line items with fixed parser
                ocr_text = invoice.get('ocrText', '')
                line_items = parser.parse_line_items(ocr_text)
                
                # Extract totals
                totals = parser.extract_totals(ocr_text)
                
                # Prepare update
                update_data = {
                    'lineItems': line_items
                }
                
                # Update subtotal and tax if found
                if totals.get('subtotal'):
                    update_data['subtotalAmount'] = totals['subtotal']
                if totals.get('tax'):
                    update_data['taxAmount'] = totals['tax']
                
                # Update in database
                result = await db.invoices.update_one(
                    {'_id': invoice['_id']},
                    {'$set': update_data}
                )
                
                if result.modified_count > 0:
                    old_count = len(invoice.get('lineItems', []))
                    new_count = len(line_items)
                    
                    if old_count != new_count:
                        print(f"   ✅ Updated: {old_count} → {new_count} line items")
                    else:
                        print(f"   ✓ Verified: {new_count} line items")
                    
                    updated_count += 1
                else:
                    print(f"   ⚠️  No changes needed")
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
                error_count += 1
                continue
        
        print("\n" + "="*60)
        print("📊 Summary:")
        print(f"   • Total invoices: {len(invoices)}")
        print(f"   • Updated: {updated_count}")
        print(f"   • Errors: {error_count}")
        print("="*60 + "\n")
        
        if updated_count > 0:
            print("✅ Re-processing completed! Invoices should now show correct line items.")
        else:
            print("ℹ️  All invoices already have correct line items.")
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(reprocess_invoices())
