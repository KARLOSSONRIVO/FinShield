# Anomaly Detection Implementation Plan

## Overview

Implementing **Stage 2: Anomaly Detection** in the FinShield verification pipeline using a hybrid approach:
- **Rule-based validation** for mathematical correctness (must pass)
- **Isolation Forest ML model** for contextual anomaly detection (organization-specific patterns)
- **S3 storage** for trained models with **in-memory caching** for performance

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ANOMALY DETECTION FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

Invoice arrives → Verification Pipeline → Stage 2: Anomaly Detection
                                                  │
                                                  ▼
                                    ┌─────────────────────────┐
                                    │  Rule-Based Validation  │
                                    │  (Always runs)          │
                                    │  - Math verification    │
                                    │  - Date validation      │
                                    │  - Amount sanity        │
                                    │  - Round number check   │
                                    └────────────┬────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────────┐
                                    │  Check for ML Model     │
                                    │  (get_model_from_s3)    │
                                    └────────────┬────────────┘
                                                 │
                                   ┌─────────────┴─────────────┐
                                   │                           │
                               Model Exists              No Model Found
                                   │                           │
                                   ▼                           ▼
                    ┌──────────────────────────┐    ┌──────────────────┐
                    │ Check Memory Cache       │    │ Use Rules Only   │
                    └──────┬───────────────────┘    └──────────────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
             Cache HIT         Cache MISS
                  │                 │
                  ▼                 ▼
         ┌────────────────┐  ┌─────────────────┐
         │ Use Cached     │  │ Download from   │
         │ Model (<1ms)   │  │ S3 (150ms)      │
         └────────────────┘  └────────┬────────┘
                  │                    │
                  │                    ▼
                  │           ┌─────────────────┐
                  │           │ Cache Model     │
                  │           │ in Memory       │
                  │           └────────┬────────┘
                  │                    │
                  └────────────────────┘
                           │
                           ▼
                ┌────────────────────────┐
                │ Extract Features       │
                │ - total, subtotal, tax │
                │ - ratios, patterns     │
                │ - historical context   │
                └──────────┬─────────────┘
                           │
                           ▼
                ┌────────────────────────┐
                │ Model Prediction       │
                │ (Anomaly Score)        │
                └──────────┬─────────────┘
                           │
                           ▼
                ┌────────────────────────┐
                │ Combine Scores         │
                │ - Rules: 60%           │
                │ - ML: 40%              │
                └──────────┬─────────────┘
                           │
                           ▼
                ┌────────────────────────┐
                │ explain_ml_anomaly()   │
                │ → plain-English flag   │
                └──────────┬─────────────┘
                           │
                           ▼
                ┌────────────────────────┐
                │ Return LayerResult     │
                │ - score: 0.0 - 1.0     │
                │ - details: {model_used}│  ← raw check scores stripped
                │ - flags: [ML text]     │  ← plain-English only
                │ - verdict: PASS/WARN/  │
                │            FAIL        │
                └────────────────────────┘
```

---

## Implementation Components

### **1. Rule-Based Validation (Always Runs)**

#### **A. Line Item Total Verification (50% weight)**
```python
Purpose: Verify that math adds up correctly
Logic:
  1. Parse line items from invoice text
  2. Calculate: expected_total = subtotal + tax + other_charges
  3. Compare with invoice.total
  4. Check if discrepancy <= 2% tolerance
  
Scoring:
  - Discrepancy > 10% → score: 0.0 (Critical)
  - Discrepancy 5-10% → score: 0.3 (High)
  - Discrepancy 2-5%  → score: 0.6 (Medium)
  - Discrepancy < 2%  → score: 1.0 (Pass)

Example:
  Invoice shows:
    Subtotal: $100.00
    Tax: $10.00
    Total: $110.00
  
  Calculated: $100 + $10 = $110 ✓
  Discrepancy: $0 (0%)
  Score: 1.0 (Pass)
```

#### **B. Date Validation (20% weight)**
```python
Purpose: Check for illogical dates
Logic:
  1. Future date check: invoice_date > today + 30 days → FAIL
  2. Backdated check: invoice_date < today - 365 days → WARN
  3. Weekend/holiday anomaly (optional)
  
Scoring:
  - Date > 30 days future → score: 0.0
  - Date > 1 year old → score: 0.5
  - Normal date range → score: 1.0

Example:
  Today: 2026-02-01
  Invoice date: 2026-02-05 (4 days future)
  Score: 1.0 (Pass)
  
  Invoice date: 2026-04-01 (60 days future)
  Score: 0.0 (Fail - too far in future)
```

#### **C. Amount Sanity Checks (15% weight)**
```python
Purpose: Detect obviously invalid amounts
Logic:
  1. Zero or negative: total <= 0 → FAIL
  2. Unreasonably high: total > threshold (org-specific or default $1M)
  3. Decimal anomalies: negative subtotal, negative tax
  
Scoring:
  - Amount <= 0 → score: 0.0
  - Amount > $1,000,000 → score: 0.3
  - Normal amount → score: 1.0

Example:
  Total: -$500 → score: 0.0 (Fail)
  Total: $2,500,000 → score: 0.3 (Warn - very high)
  Total: $5,000 → score: 1.0 (Pass)
```

#### **D. Round Number Detection (15% weight)**
```python
Purpose: Flag suspiciously round amounts
Logic:
  1. Check if total % 1000 == 0 (e.g., $5,000.00)
  2. Check if total % 100 == 0 (e.g., $500.00)
  3. Natural invoices have varied cents
  
Scoring:
  - Exact $1000 multiple → score: 0.5
  - Exact $100 multiple → score: 0.7
  - Normal decimal → score: 1.0

Example:
  Total: $5,000.00 → score: 0.5 (Warn - suspiciously round)
  Total: $5,247.83 → score: 1.0 (Pass - natural variation)
```

---

### **2. ML-Based Contextual Analysis (Isolation Forest)**

#### **A. Feature Extraction**
```python
Features extracted per invoice:
  1. total_amount: 5000.00
  2. subtotal: 4500.00
  3. tax_amount: 500.00
  4. tax_rate: 0.111 (tax / subtotal)
  5. line_item_count: 5
  6. has_discount: 0 (binary)
  7. invoice_day_of_week: 2 (0=Monday, 6=Sunday)
  8. amount_rounded: 0 (is it exactly $100 or $1000 multiple?)
  9. subtotal_tax_ratio: 0.9 (subtotal / total)
  10. days_since_last_invoice: 7

Historical Context (optional):
  11. deviation_from_avg: 0.25 (25% higher than org average)
  12. percentile_in_org: 0.85 (85th percentile for this org)
```

#### **B. Model Training (Background Process)**
```python
Trigger: Nightly at 2 AM or after N new invoices

Process:
  1. Fetch all "clean" invoices for organization
     - Minimum 30 invoices required
     - Maximum 10,000 invoices (for performance)
  
  2. Extract features from each invoice
  
  3. Train Isolation Forest:
     - contamination=0.1 (expect 10% anomalies)
     - n_estimators=100
     - random_state=42
  
  4. Save to S3:
     - Path: s3://finshield-models/models/org_{id}_anomaly.pkl.gz
     - Compression: joblib compress=3
     - Size: ~2-10 MB per model
  
  5. Clear cache to force reload on next request

Training Time: 10-30 seconds for 1,000 invoices
```

#### **C. Model Prediction**
```python
Input: Feature vector [5000.00, 4500.00, 500.00, ...]
Output: Anomaly score (-1.5 to 1.5)
  - Negative = Anomaly (outlier)
  - Positive = Normal (inlier)

Normalization:
  normalized_score = (anomaly_score + 1.5) / 3.0
  Range: 0.0 (strong anomaly) to 1.0 (very normal)

Example:
  Feature: [5000, 4500, 500, 0.11, 5, 0, 2, 0, 0.9, 7]
  Raw score: -0.8 (anomaly detected)
  Normalized: (-0.8 + 1.5) / 3.0 = 0.233
  Interpretation: Invoice is anomalous for this org
```

---

### **3. Hybrid Scoring**

```python
If model exists:
  final_score = (rule_score * 0.6) + (ml_score * 0.4)
  
  Example:
    Rule score: 0.85 (math correct, dates good)
    ML score: 0.40 (amount unusual for this org)
    Final: (0.85 * 0.6) + (0.40 * 0.4) = 0.51 + 0.16 = 0.67
    Verdict: WARN

If no model:
  final_score = rule_score
  
  Example:
    Rule score: 0.85
    Final: 0.85
    Verdict: PASS

Verdict Thresholds:
  - score >= 0.75 → PASS
  - score >= 0.50 → WARN
  - score < 0.50 → FAIL
```

---

### **4. S3 Model Storage**

#### **Bucket Structure**
```
s3://finshield-models/
├─ models/
│   ├─ org_507f1f77bcf86cd799439011_anomaly.pkl.gz
│   ├─ org_507f1f77bcf86cd799439012_anomaly.pkl.gz
│   └─ org_507f1f77bcf86cd799439013_anomaly.pkl.gz
└─ archive/ (optional)
    └─ 2026-01/
        └─ org_507f1f77bcf86cd799439011_anomaly.pkl.gz
```

#### **AWS Configuration**
```python
# Environment Variables
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
MODEL_BUCKET_NAME=finshield-models

# IAM Permissions Required
s3:GetObject
s3:PutObject
s3:DeleteObject
```

#### **Model Operations**

**Upload (Training Worker):**
```python
def save_model_to_s3(org_id: str, model):
    buffer = BytesIO()
    joblib.dump(model, buffer, compress=3)
    buffer.seek(0)
    
    s3_client.upload_fileobj(
        buffer,
        'finshield-models',
        f'models/org_{org_id}_anomaly.pkl.gz'
    )
```

**Download (API Service):**
```python
def load_model_from_s3(org_id: str):
    buffer = BytesIO()
    s3_client.download_fileobj(
        'finshield-models',
        f'models/org_{org_id}_anomaly.pkl.gz',
        buffer
    )
    buffer.seek(0)
    return joblib.load(buffer)
```

---

### **5. In-Memory Caching**

#### **Cache Implementation**
```python
# Global module-level cache
MODEL_CACHE = {}

def get_model_from_s3(org_id: str):
    """
    Load model with caching
    
    Performance:
      - Cache HIT: <1ms (from RAM)
      - Cache MISS: ~150ms (S3 download + deserialize)
    """
    
    # Check cache first
    if org_id in MODEL_CACHE:
        logger.debug(f"Model cache HIT for org {org_id}")
        return MODEL_CACHE[org_id]
    
    logger.info(f"Model cache MISS for org {org_id}")
    
    # Download from S3
    try:
        model = load_model_from_s3(org_id)
        
        # Cache for future requests
        MODEL_CACHE[org_id] = model
        
        return model
    except NoSuchKey:
        logger.warning(f"No model found for org {org_id}")
        return None
```

#### **Cache Invalidation**
```python
def clear_model_cache(org_id: str = None):
    """
    Clear cache when model is retrained
    
    Args:
        org_id: Clear specific org, or None to clear all
    """
    if org_id:
        MODEL_CACHE.pop(org_id, None)
        logger.info(f"Cleared cache for org {org_id}")
    else:
        MODEL_CACHE.clear()
        logger.info("Cleared all model cache")
```

#### **Cache Lifecycle**
```
API Server Starts:
  MODEL_CACHE = {} (empty)

First Invoice from Org A:
  Cache MISS → Download from S3 (150ms) → Cache model

Second Invoice from Org A:
  Cache HIT → Use cached model (<1ms)

Model Retrained:
  Training worker → clear_model_cache('org_A')

Next Invoice from Org A:
  Cache MISS → Download NEW model (150ms) → Cache new model
```

---

## File Structure

```
AI_SERVICE/
├─ app/
│   ├─ core/
│   │   └─ config.py                          [MODIFY] Add S3 settings
│   │
│   ├─ pipelines/
│   │   └─ verification/
│   │       └─ stages/
│   │           └─ anomaly.py                 [IMPLEMENT] Full logic
│   │
│   ├─ engines/
│   │   └─ anomaly/                           [NEW FOLDER]
│   │       ├─ __init__.py                    [CREATE]
│   │       ├─ model_loader.py                [CREATE] S3 + caching
│   │       ├─ feature_extractor.py           [CREATE] Feature extraction
│   │       └─ line_item_parser.py            [CREATE] Parse line items
│   │
│   └─ utils/
│       └─ parser.py                          [CHECK] May need enhancements
│
├─ scripts/                                    [NEW FOLDER]
│   └─ train_models.py                        [CREATE] Training script
│
├─ models/                                     [EXISTS] Local cache (optional)
│   └─ .gitkeep
│
└─ requirements.txt                            [MODIFY] Add dependencies
```

---

## Dependencies to Add

```txt
# requirements.txt

# Existing dependencies...

# Anomaly Detection
scikit-learn==1.3.2          # Isolation Forest
joblib==1.3.2                # Model serialization with compression

# AWS S3
boto3==1.29.7                # AWS SDK for Python
botocore==1.32.7

# Data processing (may already exist)
numpy>=1.24.0
pandas>=2.0.0                # Optional, for feature extraction
```

---

## Implementation Files Detail

### **1. config.py** (Modify)

```python
# app/core/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Existing settings
    MONGODB_URI: str
    IPFS_GATEWAY: str
    PINATA_API_KEY: str
    
    # AWS S3 for Models (NEW)
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    MODEL_BUCKET_NAME: str = "finshield-models"
    
    # Anomaly Detection Settings (NEW)
    ANOMALY_MIN_INVOICES: int = 30  # Minimum invoices before training
    ANOMALY_MATH_TOLERANCE: float = 0.02  # 2% tolerance for math errors
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

### **2. model_loader.py** (Create)

```python
# app/engines/anomaly/model_loader.py

"""
Model loader with S3 storage and in-memory caching
"""

import boto3
import joblib
import logging
from io import BytesIO
from typing import Optional
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

# Global in-memory cache
MODEL_CACHE = {}

def get_model_from_s3(org_id: str):
    """
    Load Isolation Forest model from S3 with caching
    
    Performance:
        - First call: ~150ms (S3 download)
        - Cached calls: <1ms (from memory)
    
    Args:
        org_id: Organization ID
    
    Returns:
        Trained model or None if not found
    """
    # Check cache first
    if org_id in MODEL_CACHE:
        logger.debug(f"Model cache HIT for org {org_id}")
        return MODEL_CACHE[org_id]
    
    logger.info(f"Model cache MISS for org {org_id}, downloading from S3...")
    
    try:
        # Download from S3
        s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
        
        buffer = BytesIO()
        s3_client.download_fileobj(
            settings.MODEL_BUCKET_NAME,
            s3_key,
            buffer
        )
        buffer.seek(0)
        
        # Deserialize model
        model = joblib.load(buffer)
        
        # Cache for future requests
        MODEL_CACHE[org_id] = model
        
        logger.info(f"✅ Model loaded and cached for org {org_id}")
        return model
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            logger.warning(f"No model found in S3 for org {org_id}")
        else:
            logger.error(f"Error loading model from S3 for org {org_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading model for org {org_id}: {e}")
        return None


def save_model_to_s3(org_id: str, model):
    """
    Save trained model to S3
    
    Args:
        org_id: Organization ID
        model: Trained Isolation Forest model
    
    Returns:
        S3 key path
    """
    try:
        # Serialize with compression
        buffer = BytesIO()
        joblib.dump(model, buffer, compress=3)
        buffer.seek(0)
        
        # Upload to S3
        s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
        s3_client.upload_fileobj(
            buffer,
            settings.MODEL_BUCKET_NAME,
            s3_key,
            ExtraArgs={
                'ContentType': 'application/octet-stream'
            }
        )
        
        logger.info(f"✅ Model uploaded to S3: {s3_key}")
        return s3_key
        
    except Exception as e:
        logger.error(f"Error saving model to S3 for org {org_id}: {e}")
        raise


def clear_model_cache(org_id: Optional[str] = None):
    """
    Clear cached models (call after retraining)
    
    Args:
        org_id: Clear specific org, or None to clear all
    """
    if org_id:
        MODEL_CACHE.pop(org_id, None)
        logger.info(f"Cleared cache for org {org_id}")
    else:
        MODEL_CACHE.clear()
        logger.info("Cleared all model cache")


def get_cache_stats():
    """Get cache statistics for monitoring"""
    return {
        'cached_models': len(MODEL_CACHE),
        'organizations': list(MODEL_CACHE.keys())
    }
```

---

### **3. feature_extractor.py** (Create)

```python
# app/engines/anomaly/feature_extractor.py

"""
Feature extraction for Isolation Forest anomaly detection
"""

import logging
from datetime import datetime
from typing import Dict, List

logger = logging.getLogger(__name__)

class FeatureExtractor:
    """Extract numerical features from invoice data"""
    
    def extract_features(
        self,
        invoice_data: dict,
        organization_id: str,
        db
    ) -> List[float]:
        """
        Extract feature vector for anomaly detection
        
        Features:
            1. total_amount
            2. subtotal
            3. tax_amount
            4. tax_rate (tax / subtotal)
            5. line_item_count
            6. has_discount (binary)
            7. invoice_day_of_week
            8. amount_rounded (binary)
            9. subtotal_tax_ratio (subtotal / total)
            10. days_since_last_invoice
        
        Args:
            invoice_data: Parsed invoice data
            organization_id: Organization ID
            db: Database connection
        
        Returns:
            Feature vector [f1, f2, ..., f10]
        """
        try:
            # Basic amounts
            total = float(invoice_data.get('total', 0))
            subtotal = float(invoice_data.get('subtotal', total))
            tax = float(invoice_data.get('tax', 0))
            
            # Calculate tax rate
            tax_rate = (tax / subtotal) if subtotal > 0 else 0.0
            
            # Line items
            line_items = invoice_data.get('line_items', [])
            line_item_count = len(line_items)
            
            # Discount detection
            has_discount = 1 if invoice_data.get('discount', 0) > 0 else 0
            
            # Date features
            invoice_date_str = invoice_data.get('date')
            if invoice_date_str:
                try:
                    invoice_date = datetime.fromisoformat(invoice_date_str)
                    day_of_week = invoice_date.weekday()  # 0=Monday, 6=Sunday
                except:
                    day_of_week = 0
            else:
                day_of_week = 0
            
            # Round number detection
            amount_rounded = 1 if (total % 100 == 0 or total % 1000 == 0) else 0
            
            # Ratio
            subtotal_tax_ratio = (subtotal / total) if total > 0 else 0.0
            
            # Historical context: days since last invoice
            days_since_last = self._get_days_since_last_invoice(
                organization_id,
                invoice_date_str,
                db
            )
            
            features = [
                total,
                subtotal,
                tax,
                tax_rate,
                line_item_count,
                has_discount,
                day_of_week,
                amount_rounded,
                subtotal_tax_ratio,
                days_since_last
            ]
            
            logger.debug(f"Extracted features: {features}")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            # Return default features on error
            return [0.0] * 10
    
    def _get_days_since_last_invoice(
        self,
        organization_id: str,
        current_date_str: str,
        db
    ) -> float:
        """Calculate days since last invoice"""
        try:
            if not current_date_str:
                return 0.0
            
            current_date = datetime.fromisoformat(current_date_str)
            
            # Find most recent invoice before this one
            from bson import ObjectId
            last_invoice = db.invoices.find_one(
                {
                    'organizationId': organization_id,
                    'date': {'$lt': current_date.isoformat()},
                    'aiVerdict': 'clean'
                },
                sort=[('date', -1)]
            )
            
            if last_invoice and last_invoice.get('date'):
                last_date = datetime.fromisoformat(last_invoice['date'])
                delta = (current_date - last_date).days
                return float(delta)
            
            return 0.0
            
        except Exception as e:
            logger.warning(f"Error calculating days since last invoice: {e}")
            return 0.0
```

---

### **4. line_item_parser.py** (Create)

```python
# app/engines/anomaly/line_item_parser.py

"""
Parse line items from invoice text for total verification
"""

import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class LineItemParser:
    """Parse line items from invoice OCR text"""
    
    def parse_line_items(self, text: str) -> List[Dict]:
        """
        Extract line items from invoice text
        
        Looks for patterns like:
            Item 1    $100.00
            Product A    $250.50
            Service X    125.00
        
        Args:
            text: Full invoice OCR text
        
        Returns:
            List of line items with amounts
            [
                {'description': 'Item 1', 'amount': 100.00},
                {'description': 'Product A', 'amount': 250.50},
                ...
            ]
        """
        line_items = []
        
        try:
            # Split text into lines
            lines = text.split('\n')
            
            # Pattern: description followed by amount
            # Matches: $100.00, $1,234.56, 100.00, etc.
            amount_pattern = r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
            
            for line in lines:
                line = line.strip()
                
                # Skip header lines and totals
                if not line or self._is_total_line(line):
                    continue
                
                # Find amount in line
                match = re.search(amount_pattern, line)
                if match:
                    amount_str = match.group(1).replace(',', '')
                    try:
                        amount = float(amount_str)
                        
                        # Extract description (text before amount)
                        description = line[:match.start()].strip()
                        
                        # Only add if description exists and amount is reasonable
                        if description and 0 < amount < 1000000:
                            line_items.append({
                                'description': description,
                                'amount': amount
                            })
                    except ValueError:
                        continue
            
            logger.debug(f"Parsed {len(line_items)} line items")
            return line_items
            
        except Exception as e:
            logger.error(f"Error parsing line items: {e}")
            return []
    
    def _is_total_line(self, line: str) -> bool:
        """Check if line is a total/subtotal/tax line"""
        total_keywords = [
            'total',
            'subtotal',
            'sub total',
            'sub-total',
            'tax',
            'amount due',
            'balance',
            'grand total',
            'sum',
            'payment'
        ]
        
        line_lower = line.lower()
        return any(keyword in line_lower for keyword in total_keywords)
    
    def extract_totals(self, text: str) -> Dict[str, Optional[float]]:
        """
        Extract subtotal, tax, and total from text
        
        Returns:
            {
                'subtotal': 100.00,
                'tax': 10.00,
                'total': 110.00
            }
        """
        totals = {
            'subtotal': None,
            'tax': None,
            'total': None
        }
        
        try:
            lines = text.split('\n')
            
            for line in lines:
                line_lower = line.lower()
                
                # Match amounts
                amount_match = re.search(r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', line)
                if not amount_match:
                    continue
                
                amount = float(amount_match.group(1).replace(',', ''))
                
                # Categorize by keywords
                if 'subtotal' in line_lower or 'sub total' in line_lower:
                    totals['subtotal'] = amount
                elif 'tax' in line_lower:
                    totals['tax'] = amount
                elif 'total' in line_lower and 'subtotal' not in line_lower:
                    totals['total'] = amount
            
            return totals
            
        except Exception as e:
            logger.error(f"Error extracting totals: {e}")
            return totals
```

---

### **5. anomaly.py** (Implement)

```python
# app/pipelines/verification/stages/anomaly.py

"""
Stage 2: Anomaly Detection Layer

Hybrid approach:
  - Rule-based validation (math, dates, amounts)
  - ML-based contextual analysis (Isolation Forest)
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

from app.pipelines.verification.stages.base import BaseLayer, LayerResult, LayerVerdict
from app.engines.anomaly.model_loader import get_model_from_s3
from app.engines.anomaly.feature_extractor import FeatureExtractor
from app.engines.anomaly.line_item_parser import LineItemParser
from app.core.config import settings

logger = logging.getLogger(__name__)

class AnomalyDetectionLayer(BaseLayer):
    """
    Anomaly Detection Layer
    
    Validates invoice using:
      1. Rule-based checks (always)
      2. ML model predictions (if model exists)
    """
    
    # Verdict thresholds
    SCORE_PASS_THRESHOLD = 0.75
    SCORE_WARN_THRESHOLD = 0.50
    
    # Rule weights
    WEIGHT_LINE_ITEMS = 0.50
    WEIGHT_DATE = 0.20
    WEIGHT_AMOUNT = 0.15
    WEIGHT_ROUND_NUMBER = 0.15
    
    # ML weights (if model exists)
    WEIGHT_RULES = 0.6
    WEIGHT_ML = 0.4
    
    def __init__(self, db):
        super().__init__(name="anomaly")
        self.db = db
        self.feature_extractor = FeatureExtractor()
        self.line_item_parser = LineItemParser()
    
    async def process(
        self,
        invoice_data: dict,
        organization_id: str,
        **kwargs
    ) -> LayerResult:
        """
        Process invoice through anomaly detection
        
        Args:
            invoice_data: Parsed invoice data (from OCR)
            organization_id: Organization ID
            **kwargs: Additional context (layout_data, etc.)
        
        Returns:
            LayerResult with score and verdict
        """
        issues = []
        checks = {}
        
        # PART 1: Rule-Based Validation (Always Runs)
        logger.info(f"Running rule-based validation for org {organization_id}")
        
        # 1. Line Item Total Verification (50%)
        line_item_score, line_item_issue = self._check_line_item_totals(
            invoice_data,
            kwargs.get('raw_text', '')
        )
        checks['line_items'] = line_item_score
        if line_item_issue:
            issues.append(line_item_issue)
        
        # 2. Date Validation (20%)
        date_score, date_issue = self._check_date_validity(invoice_data)
        checks['date'] = date_score
        if date_issue:
            issues.append(date_issue)
        
        # 3. Amount Sanity (15%)
        amount_score, amount_issue = self._check_amount_sanity(invoice_data)
        checks['amount'] = amount_score
        if amount_issue:
            issues.append(amount_issue)
        
        # 4. Round Number Detection (15%)
        round_score, round_issue = self._check_round_numbers(invoice_data)
        checks['round_number'] = round_score
        if round_issue:
            issues.append(round_issue)
        
        # Calculate weighted rule score
        rule_score = (
            line_item_score * self.WEIGHT_LINE_ITEMS +
            date_score * self.WEIGHT_DATE +
            amount_score * self.WEIGHT_AMOUNT +
            round_score * self.WEIGHT_ROUND_NUMBER
        )
        
        logger.info(f"Rule-based score: {rule_score:.3f}")
        
        # PART 2: ML-Based Contextual Analysis (If Model Exists)
        model = get_model_from_s3(organization_id)
        
        if model:
            logger.info(f"Model found for org {organization_id}, running ML prediction")
            
            try:
                # Extract features
                features = self.feature_extractor.extract_features(
                    invoice_data,
                    organization_id,
                    self.db
                )
                
                # Get anomaly score from model
                ml_score = self._predict_with_model(model, features)
                checks['ml_anomaly'] = ml_score
                
                # Combine scores
                final_score = (rule_score * self.WEIGHT_RULES) + (ml_score * self.WEIGHT_ML)
                logger.info(f"Combined score (rules {rule_score:.3f} + ML {ml_score:.3f}): {final_score:.3f}")
                
                if ml_score < 0.5:
                    issues.append(f"ML model flagged invoice as anomalous (score: {ml_score:.2f})")
                
            except Exception as e:
                logger.error(f"Error in ML prediction: {e}")
                final_score = rule_score
                issues.append(f"ML prediction failed, using rules only")
        else:
            logger.info(f"No model found for org {organization_id}, using rules only")
            final_score = rule_score
            issues.append("Insufficient historical data for ML analysis")
        
        # Determine verdict
        if final_score >= self.SCORE_PASS_THRESHOLD:
            verdict = LayerVerdict.PASS
        elif final_score >= self.SCORE_WARN_THRESHOLD:
            verdict = LayerVerdict.WARN
        else:
            verdict = LayerVerdict.FAIL
        
        return LayerResult(
            layer_name=self.name,
            score=final_score,
            verdict=verdict,
            details=checks,
            issues=issues
        )
    
    def _check_line_item_totals(
        self,
        invoice_data: dict,
        raw_text: str
    ) -> tuple[float, Optional[str]]:
        """
        Verify line items add up to total
        
        Returns:
            (score, issue_message)
        """
        try:
            # Get invoice totals
            total = float(invoice_data.get('total', 0))
            subtotal = float(invoice_data.get('subtotal', 0))
            tax = float(invoice_data.get('tax', 0))
            
            if total == 0:
                return 0.5, "Total amount is zero"
            
            # If subtotal/tax not provided, try to parse from text
            if subtotal == 0 or tax == 0:
                parsed_totals = self.line_item_parser.extract_totals(raw_text)
                subtotal = parsed_totals.get('subtotal', subtotal)
                tax = parsed_totals.get('tax', tax)
            
            # Calculate expected total
            expected_total = subtotal + tax
            
            # Calculate discrepancy
            discrepancy = abs(expected_total - total)
            discrepancy_pct = (discrepancy / total) * 100 if total > 0 else 0
            
            # Apply tolerance
            tolerance_pct = settings.ANOMALY_MATH_TOLERANCE * 100
            
            if discrepancy_pct <= tolerance_pct:
                return 1.0, None
            elif discrepancy_pct <= 5.0:
                return 0.6, f"Math discrepancy: {discrepancy_pct:.1f}% (medium)"
            elif discrepancy_pct <= 10.0:
                return 0.3, f"Math discrepancy: {discrepancy_pct:.1f}% (high)"
            else:
                return 0.0, f"Math discrepancy: {discrepancy_pct:.1f}% (critical)"
                
        except Exception as e:
            logger.error(f"Error checking line items: {e}")
            return 0.5, "Unable to verify line item totals"
    
    def _check_date_validity(self, invoice_data: dict) -> tuple[float, Optional[str]]:
        """Check if invoice date is logical"""
        try:
            date_str = invoice_data.get('date')
            if not date_str:
                return 0.7, "No date provided"
            
            invoice_date = datetime.fromisoformat(date_str)
            today = datetime.now()
            
            # Check future dates
            days_future = (invoice_date - today).days
            if days_future > 30:
                return 0.0, f"Invoice dated {days_future} days in future"
            
            # Check backdated
            days_past = (today - invoice_date).days
            if days_past > 365:
                return 0.5, f"Invoice dated {days_past} days ago (over 1 year)"
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error checking date: {e}")
            return 0.7, "Invalid date format"
    
    def _check_amount_sanity(self, invoice_data: dict) -> tuple[float, Optional[str]]:
        """Check if amounts are reasonable"""
        try:
            total = float(invoice_data.get('total', 0))
            
            if total <= 0:
                return 0.0, f"Invalid total amount: ${total}"
            
            if total > 1000000:
                return 0.3, f"Unusually high amount: ${total:,.2f}"
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error checking amounts: {e}")
            return 0.5, "Unable to verify amounts"
    
    def _check_round_numbers(self, invoice_data: dict) -> tuple[float, Optional[str]]:
        """Detect suspiciously round amounts"""
        try:
            total = float(invoice_data.get('total', 0))
            
            if total % 1000 == 0:
                return 0.5, f"Suspiciously round amount: ${total:,.2f}"
            
            if total % 100 == 0:
                return 0.7, f"Round amount detected: ${total:,.2f}"
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error checking round numbers: {e}")
            return 1.0, None
    
    def _predict_with_model(self, model, features: list) -> float:
        """
        Get anomaly score from Isolation Forest
        
        Args:
            model: Trained Isolation Forest
            features: Feature vector
        
        Returns:
            Normalized score (0.0 = anomaly, 1.0 = normal)
        """
        try:
            # Predict anomaly score
            # Returns negative for anomalies, positive for normal
            raw_score = model.decision_function([features])[0]
            
            # Normalize to 0-1 range
            # Typical range: -1.5 to 1.5
            normalized = (raw_score + 1.5) / 3.0
            
            # Clamp to [0, 1]
            normalized = max(0.0, min(1.0, normalized))
            
            return normalized
            
        except Exception as e:
            logger.error(f"Error in model prediction: {e}")
            return 0.5  # Neutral score on error
```

---

### **6. train_models.py** (Create)

```python
# scripts/train_models.py

"""
Training script for Isolation Forest models

Usage:
    python scripts/train_models.py --org-id <org_id>
    python scripts/train_models.py --all
"""

import sys
import os
import argparse
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.ensemble import IsolationForest
from app.db.mongo import get_database
from app.engines.anomaly.feature_extractor import FeatureExtractor
from app.engines.anomaly.model_loader import save_model_to_s3, clear_model_cache
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelTrainer:
    """Train Isolation Forest models for organizations"""
    
    def __init__(self):
        self.db = get_database()
        self.feature_extractor = FeatureExtractor()
    
    def train_organization_model(self, org_id: str) -> bool:
        """
        Train model for specific organization
        
        Args:
            org_id: Organization ID
        
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"Training model for organization: {org_id}")
        
        try:
            # 1. Check invoice count
            invoice_count = self.db.invoices.count_documents({
                'organizationId': org_id,
                'aiVerdict': 'clean',
                'total': {'$exists': True}
            })
            
            if invoice_count < settings.ANOMALY_MIN_INVOICES:
                logger.warning(
                    f"Insufficient data for org {org_id}: "
                    f"{invoice_count} invoices (need {settings.ANOMALY_MIN_INVOICES})"
                )
                return False
            
            logger.info(f"Found {invoice_count} clean invoices")
            
            # 2. Fetch invoices
            invoices = list(self.db.invoices.find({
                'organizationId': org_id,
                'aiVerdict': 'clean',
                'total': {'$exists': True}
            }).limit(10000))  # Cap at 10k for performance
            
            # 3. Extract features
            logger.info("Extracting features...")
            feature_matrix = []
            
            for invoice in invoices:
                features = self.feature_extractor.extract_features(
                    invoice,
                    org_id,
                    self.db
                )
                feature_matrix.append(features)
            
            logger.info(f"Extracted {len(feature_matrix)} feature vectors")
            
            # 4. Train model
            logger.info("Training Isolation Forest...")
            model = IsolationForest(
                contamination=0.1,
                n_estimators=100,
                random_state=42,
                n_jobs=-1
            )
            model.fit(feature_matrix)
            
            # 5. Save to S3
            logger.info("Uploading model to S3...")
            s3_key = save_model_to_s3(org_id, model)
            
            # 6. Clear cache
            clear_model_cache(org_id)
            
            logger.info(f"✅ Model training complete for org {org_id}")
            logger.info(f"   S3 key: {s3_key}")
            logger.info(f"   Training samples: {len(feature_matrix)}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error training model for org {org_id}: {e}")
            return False
    
    def train_all_organizations(self):
        """Train models for all organizations with sufficient data"""
        logger.info("Training models for all organizations...")
        
        # Find organizations with sufficient invoices
        pipeline = [
            {
                '$match': {
                    'aiVerdict': 'clean',
                    'total': {'$exists': True}
                }
            },
            {
                '$group': {
                    '_id': '$organizationId',
                    'count': {'$sum': 1}
                }
            },
            {
                '$match': {
                    'count': {'$gte': settings.ANOMALY_MIN_INVOICES}
                }
            }
        ]
        
        orgs_with_data = list(self.db.invoices.aggregate(pipeline))
        logger.info(f"Found {len(orgs_with_data)} organizations with sufficient data")
        
        success_count = 0
        fail_count = 0
        
        for org_data in orgs_with_data:
            org_id = org_data['_id']
            count = org_data['count']
            
            logger.info(f"\n{'='*60}")
            logger.info(f"Organization: {org_id} ({count} invoices)")
            logger.info(f"{'='*60}")
            
            if self.train_organization_model(org_id):
                success_count += 1
            else:
                fail_count += 1
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Training Summary:")
        logger.info(f"  ✅ Successful: {success_count}")
        logger.info(f"  ❌ Failed: {fail_count}")
        logger.info(f"  Total: {len(orgs_with_data)}")
        logger.info(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description='Train Isolation Forest models')
    parser.add_argument(
        '--org-id',
        type=str,
        help='Train model for specific organization'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Train models for all organizations'
    )
    
    args = parser.parse_args()
    
    trainer = ModelTrainer()
    
    if args.org_id:
        trainer.train_organization_model(args.org_id)
    elif args.all:
        trainer.train_all_organizations()
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
```

---

## Testing Plan

### **1. Unit Tests**

```python
# tests/test_anomaly_detection.py

def test_line_item_verification():
    """Test math validation"""
    invoice = {
        'total': 110.00,
        'subtotal': 100.00,
        'tax': 10.00
    }
    score, issue = layer._check_line_item_totals(invoice, "")
    assert score == 1.0
    assert issue is None

def test_date_validation():
    """Test date checks"""
    # Future date
    invoice = {'date': '2026-12-01'}
    score, issue = layer._check_date_validity(invoice)
    assert score == 0.0
    
def test_model_caching():
    """Test cache behavior"""
    # First call - cache miss
    model1 = get_model_from_s3('org_123')
    
    # Second call - cache hit
    model2 = get_model_from_s3('org_123')
    
    assert model1 is model2  # Same object

def test_feature_extraction():
    """Test feature vector"""
    features = extractor.extract_features(invoice, 'org_123', db)
    assert len(features) == 10
    assert all(isinstance(f, float) for f in features)
```

### **2. Integration Tests**

```python
# tests/integration/test_anomaly_pipeline.py

async def test_full_anomaly_detection():
    """Test complete flow"""
    result = await layer.process(
        invoice_data=sample_invoice,
        organization_id='org_123'
    )
    
    assert result.score >= 0.0 and result.score <= 1.0
    assert result.verdict in [LayerVerdict.PASS, LayerVerdict.WARN, LayerVerdict.FAIL]

async def test_with_and_without_model():
    """Test fallback when no model"""
    # Org with model
    result1 = await layer.process(invoice, 'org_with_model')
    
    # Org without model
    result2 = await layer.process(invoice, 'org_without_model')
    
    # Both should return valid results
    assert result1.score > 0
    assert result2.score > 0
```

### **3. Manual Testing**

```bash
# Test model training
python scripts/train_models.py --org-id 507f1f77bcf86cd799439011

# Test OCR with anomaly detection
curl -X POST http://localhost:8000/api/ocr/process \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": "inv_123",
    "organization_id": "org_123",
    "ipfs_hash": "QmXxx..."
  }'

# Check cache stats (add endpoint)
curl http://localhost:8000/api/admin/model-cache-stats
```

---

## Deployment Checklist

### **Before Deployment**

- [ ] Create S3 bucket: `finshield-models`
- [ ] Configure IAM permissions for S3 access
- [ ] Add AWS credentials to `.env` file
- [ ] Update `requirements.txt` with new dependencies
- [ ] Run `pip install -r requirements.txt`

### **Environment Variables**

```bash
# .env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
MODEL_BUCKET_NAME=finshield-models

ANOMALY_MIN_INVOICES=30
ANOMALY_MATH_TOLERANCE=0.02
```

### **Post-Deployment**

- [ ] Train initial models: `python scripts/train_models.py --all`
- [ ] Setup cron job for nightly retraining
- [ ] Monitor S3 bucket size and costs
- [ ] Add logging/monitoring for cache performance
- [ ] Test with real invoices

---

## Performance Expectations

### **Processing Time**

```
Rule-based validation: ~50ms
Model loading (cache miss): ~150ms
Model loading (cache hit): <1ms
Feature extraction: ~20ms
Model prediction: ~5ms

Total (first invoice): ~225ms
Total (cached): ~75ms
```

### **Storage**

```
Per organization model: 2-10 MB
1,000 organizations: ~5 GB
Monthly S3 cost: ~$0.12
```

### **Accuracy**

```
Rule-based: Catches obvious errors (math, dates)
ML-based: Detects contextual anomalies
Expected false positive rate: ~10% (tunable)
```

---

## Future Enhancements

1. **Advanced Line Item Parsing**
   - OCR table detection
   - Multi-column extraction
   - Better regex patterns

2. **Model Retraining Optimization**
   - Incremental learning
   - Only retrain if >N new invoices
   - A/B testing new models

3. **Feature Engineering**
   - Vendor patterns
   - Payment terms
   - PO number analysis

4. **Monitoring**
   - Model drift detection
   - Performance metrics dashboard
   - Alerting for anomaly spikes

5. **Multi-Region Support**
   - Replicate models to multiple S3 regions
   - Edge caching with CloudFront

---

## Support & Troubleshooting

### **Common Issues**

**Issue: Model not found in S3**
```
Solution: Train model first using scripts/train_models.py
```

**Issue: Cache not clearing after retraining**
```
Solution: 
- Check if training worker has access to API cache
- Use Redis pub/sub for distributed cache invalidation
- Implement TTL-based cache expiration
```

**Issue: S3 403 Forbidden**
```
Solution:
- Verify AWS credentials in .env
- Check IAM permissions (s3:GetObject, s3:PutObject)
- Ensure bucket name is correct
```

**Issue: Slow first request**
```
Expected: First request per org downloads model (~150ms)
Solution: Implement warm-up script to pre-cache hot models
```

---

## Contacts & Resources

- **AWS S3 Documentation**: https://docs.aws.amazon.com/s3/
- **scikit-learn Isolation Forest**: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html
- **boto3 Documentation**: https://boto3.amazonaws.com/v1/documentation/api/latest/index.html

---

**END OF IMPLEMENTATION PLAN**
