# Layout Detection Layer

The **Layout Detection Layer** is **Stage 1** of the FinShield verification pipeline. It acts as a structural biometric scanner, ensuring that an incoming invoice visually and geometrically matches the organization's verified master template.

## Overview

Unlike standard OCR which only reads text content, Layout Detection analyzes the **geometric DNA** of the document. It catches sophisticated fraudsters who might use the correct company name and logo but generate the invoice using a different software or template.

### Core Objectives
1.  **Template Verification**: Ensure the invoice uses the official company format.
2.  **Impersonation Defense**: Detect "Clone Invoices" where text is identical but layout is generic.
3.  **Extraction Quality Check**: Verify that OCR correctly identified the document structure.

---

## How It Works

The system operates in four primary phases:

### 1. Extraction (Visual Mapping)
When an invoice is uploaded, the **Tesseract OCR** engine extracts:
*   Every word/line of text.
*   The precise **Bounding Box** ($x, y, width, height$) for every element.
*   The **Zone** (e.g., Top-Left, Bottom-Right) of the element.

### 2. Signature Building
The `Layout Signature Builder` (`app/engines/tesseract/signature.py`) converts thousands of coordinates into a compact mathematical fingerprint. It calculates:
*   **Quadrant Density**: How many items are in each corner of the page.
*   **Center of Gravity**: The average statistical center of all content.
*   **Geometric Stats**: Mean and Standard Deviation of block sizes and positions.

### 3. Comparison
The `LayoutComparisonEngine` (`app/engines/layout/comparison_engine.py`) retrieves the organization's stored **Master Template Signature** and calculates a similarity score based on weighted factors.

### 4. Verdict Determination
The layer returns a verdict based on the similarity score:

| Score | Verdict | Meaning |
| :--- | :--- | :--- |
| **≥ 0.95** | **PASS** | Perfect structural match. |
| **0.85 - 0.94** | **WARN** | Minor structural shifts (e.g., scanning skew). |
| **< 0.85** | **FAIL** | Major mismatch. Likely a different document or fraudulent clone. |

---

## Scoring & Weights

The comparison score (0.0 to 1.0) is derived from five components. Note the heavy emphasis on **Structural Features**.

| Component | Weight | Description |
| :--- | :--- | :--- |
| **Structural Features** | **60%** | **Geometry**: Analyzes quadrant density and positional distribution statistics. |
| **Field Positions** | **15%** | **Zones**: Verifies if "Total", "Date", etc., are in the expected visual zones. |
| **Field Presence** | **10%** | **Keywords**: Checks for the existence of required form labels. |
| **Element Count** | **10%** | **Complexity**: Checks if the "busyness" of the page matches the template. |
| **General Structure** | **5%** | **Alignment**: General check for row/column alignment. |

> [!IMPORTANT]
> Because **60% of the score** is based on geometry, it is nearly impossible for a fraudster to bypass this check using a generic "Online Invoice Maker" even if they type the correct vendor details.

---

## Database Storage

The "Master Template" fingerprint is stored in the **`organizations`** collection in MongoDB.

### Schema Example
```javascript
{
  "_id": ObjectId("..."),
  "invoiceTemplate": {
    "s3Key": "templates/org_123/master.pdf",
    "layoutSignature": {
      "fields": ["invoice_number", "total", "date"],
      "positions": {
        "total": "bottom-right",
        "invoice_number": "top-right"
      },
      "elementCount": 42,
      // The geometric fingerprint used for the 60% weight
      "structuralFeatures": {
        "quadrant_density": {
           "top_left": 12, "top_right": 8, 
           "bottom_left": 15, "bottom_right": 7
        },
        "position_distribution": {
           "x": {"mean": 402.5, "median": 390.0, "stdev": 210.1},
           "y": {"mean": 515.2, "median": 480.0, "stdev": 300.5}
        }
      }
    }
  }
}
```

---

## Implementation Details

*   **Logic Layer**: `app/pipelines/verification/stages/layout.py`
*   **Comparison Engine**: `app/engines/layout/comparison_engine.py`
*   **Signature Builder**: `app/engines/tesseract/signature.py`
*   **Service Layer**: `app/services/template_service.py`
