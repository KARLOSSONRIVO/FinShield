import random
import uuid
from datetime import datetime, timedelta
import json

VENDORS = [
    "Office Supplies Inc", "Tech Solutions Ltd", "ABC Manufacturing",
    "Consulting Partners LLC", "Marketing Services Pro",
    "IT Infrastructure Inc", "Shipping & Logistics Co",
    "Professional Services Group", "Construction Materials LLC",
    "Cleaning Services Pro", "Security Systems Inc",
    "Utilities Provider Corp", "Cloud Hosting Services Ltd"
]

BAD_VENDORS = ["CASH", "Unknown", "misc", "n/a", "various", ""]

LINE_ITEMS = [
    "Consultation", "Software License", "Maintenance",
    "Equipment Rental", "Training Services", "Cloud Storage",
    "Marketing Campaign", "Legal Review", "IT Support",
    "Delivery Charges", "Installation", "Materials"
]


def random_date(start_year=2024, end_year=2026):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    return (start + timedelta(days=random.randint(0, (end - start).days))).strftime("%Y-%m-%d")


def generate_invoice(i):
    is_rejected = random.random() < 0.35  # ~35% rejected

    issued_to = random.choice(BAD_VENDORS if is_rejected else VENDORS)

    has_invoice_number = not (is_rejected and random.random() < 0.5)
    invoice_number = str(random.randint(10000000, 99999999)) if has_invoice_number else ""

    has_line_items = not (is_rejected and random.random() < 0.4)
    line_items = []

    subtotal = 0.0

    if has_line_items:
        for _ in range(random.randint(1, 7)):
            price = round(random.uniform(100, 5000), 2)
            qty = 1
            line_items.append({
                "description": random.choice(LINE_ITEMS),
                "quantity": qty,
                "unit_price": price,
                "amount": price * qty
            })
            subtotal += price

    tax_rate = random.uniform(0.08, 0.15)
    tax = round(subtotal * tax_rate, 2)

    if is_rejected and random.random() < 0.4:
        tax = round(tax * random.uniform(1.5, 3), 2)  # bad tax

    total = round(subtotal + tax, 2)

    if is_rejected and random.random() < 0.3:
        total += random.uniform(500, 5000)  # mismatch totals

    return {
        "invoiceNumber": invoice_number,
        "issuedTo": issued_to,
        "totalAmount": round(total, 2),
        "subtotalAmount": round(subtotal, 2),
        "taxAmount": round(tax, 2),
        "invoiceDate": random_date(),
        "lineItems": line_items,
        "reviewDecision": "rejected" if is_rejected else "approved"
    }


# Generate 1000 samples
dataset = [generate_invoice(i) for i in range(1000)]

# Save to JSON
with open("fraud_training_data.json", "w") as f:
    json.dump(dataset, f, indent=2)

print("✅ Generated 1000 synthetic invoice samples -> fraud_training_data.json")
