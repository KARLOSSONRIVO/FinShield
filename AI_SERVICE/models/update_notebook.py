import json
import os

NOTEBOOK_PATH = r"c:\Users\lNooisYl\Documents\IT\WEBDEV\FinShield\AI_SERVICE\models\train_fraud_model.ipynb"

# New source code for Synthetic Data Generation
SYNTHETIC_DATA_SOURCE = [
    "# ⚠️ UPDATE THIS PATH to your training dataset\n",
    "DATASET_PATH = \"fraud_training_data.json\"\n",
    "\n",
    "# Load dataset\n",
    "def load_dataset(path: str) -> pd.DataFrame:\n",
    "    \"\"\"Load invoice dataset from JSON file\"\"\"\n",
    "    with open(path, 'r') as f:\n",
    "        data = json.load(f)\n",
    "    \n",
    "    df = pd.DataFrame(data)\n",
    "    print(f\"✅ Loaded {len(df)} invoices from {path}\")\n",
    "    return df\n",
    "\n",
    "# Try to load dataset (will fail if file doesn't exist - that's OK for now)\n",
    "try:\n",
    "    df = load_dataset(DATASET_PATH)\n",
    "except FileNotFoundError:\n",
    "    print(f\"⚠️ Dataset not found at: {DATASET_PATH}\")\n",
    "    print(\"Creating sample synthetic dataset for demonstration...\")\n",
    "    \n",
    "    # Generate synthetic data for demonstration\n",
    "    np.random.seed(42)\n",
    "    n_samples = 2000\n",
    "    n_fraud = int(n_samples * 0.12)  # 12% fraud rate\n",
    "    \n",
    "    # Generate legitimate invoices\n",
    "    legitimate = []\n",
    "    for i in range(n_samples - n_fraud):\n",
    "        legitimate.append({\n",
    "            'invoiceNumber': f'INV-{2024000 + i}',\n",
    "            'issuedTo': np.random.choice(['ABC Corp', 'XYZ Ltd', 'Acme Inc', 'Global Services', 'Tech Solutions']),\n",
    "            'totalAmount': round(np.random.uniform(100, 5000), 2),\n",
    "            'subtotalAmount': 0,  # Will calculate\n",
    "            'taxAmount': 0,  # Will calculate\n",
    "            'invoiceDate': f'2024-{np.random.randint(1,13):02d}-{np.random.randint(1,29):02d}',\n",
    "            'lineItemCount': np.random.randint(1, 10),\n",
    "            'reviewDecision': 'approved'\n",
    "        })\n",
    "    \n",
    "    # Generate fraudulent invoices\n",
    "    fraud = []\n",
    "    for i in range(n_fraud):\n",
    "        fraud.append({\n",
    "            'invoiceNumber': np.random.choice([f'{i:03d}', 'test', f'INV-{i}', '']),\n",
    "            'issuedTo': np.random.choice(['Unknown Vendor', 'New Supplier', '', 'CASH']),\n",
    "            'totalAmount': round(np.random.choice([1000, 5000, 10000, 50000]) + np.random.uniform(0, 100), 2),\n",
    "            'subtotalAmount': 0,\n",
    "            'taxAmount': 0,\n",
    "            'invoiceDate': f'2025-{np.random.randint(1,13):02d}-{np.random.randint(1,29):02d}',  # Future dates\n",
    "            'lineItemCount': np.random.randint(0, 3),\n",
    "            'reviewDecision': 'rejected'\n",
    "        })\n",
    "    \n",
    "    # Combine and calculate tax/subtotal\n",
    "    all_data = legitimate + fraud\n",
    "    for item in all_data:\n",
    "        item['taxAmount'] = round(item['totalAmount'] * 0.12, 2)\n",
    "        item['subtotalAmount'] = round(item['totalAmount'] - item['taxAmount'], 2)\n",
    "    \n",
    "    df = pd.DataFrame(all_data)\n",
    "    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # Shuffle\n",
    "    \n",
    "    # Save synthetic dataset\n",
    "    with open(DATASET_PATH, 'w') as f:\n",
    "        json.dump(all_data, f, indent=2)\n",
    "    print(f\"✅ Created synthetic dataset with {len(df)} invoices ({n_fraud} fraud, {n_samples-n_fraud} legitimate)\")\n",
    "\n",
    "df.head(10)"
]

# New source code for EDA
EDA_SOURCE = [
    "# Dataset statistics\n",
    "print(\"=\" * 50)\n",
    "print(\"DATASET OVERVIEW\")\n",
    "print(\"=\" * 50)\n",
    "print(f\"\\nTotal invoices: {len(df)}\")\n",
    "print(f\"\\nClass distribution:\")\n",
    "print(df['reviewDecision'].value_counts())\n",
    "print(f\"\\nClass percentages:\")\n",
    "print(df['reviewDecision'].value_counts(normalize=True) * 100)\n",
    "\n",
    "# Visualize class distribution\n",
    "fig, axes = plt.subplots(1, 2, figsize=(12, 4))\n",
    "\n",
    "# Class distribution pie chart\n",
    "df['reviewDecision'].value_counts().plot(kind='pie', autopct='%1.1f%%', ax=axes[0], colors=['#4CAF50', '#F44336'])\n",
    "axes[0].set_title('Class Distribution')\n",
    "axes[0].set_ylabel('')\n",
    "\n",
    "# Amount distribution by class\n",
    "for label in df['reviewDecision'].unique():\n",
    "    subset = df[df['reviewDecision'] == label]['totalAmount']\n",
    "    axes[1].hist(subset, bins=30, alpha=0.6, label=label)\n",
    "axes[1].set_xlabel('Invoice Amount')\n",
    "axes[1].set_ylabel('Frequency')\n",
    "axes[1].set_title('Amount Distribution by Class')\n",
    "axes[1].legend()\n",
    "\n",
    "plt.tight_layout()\n",
    "plt.show()\n",
    "\n",
    "# Basic statistics\n",
    "print(\"\\n\" + \"=\" * 50)\n",
    "print(\"NUMERICAL STATISTICS\")\n",
    "print(\"=\" * 50)\n",
    "df.describe()"
]

# New source code for Feature Extraction
FEATURE_EXTRACTION_SOURCE = [
    "def extract_features(invoice: dict) -> dict:\n",
    "    \"\"\"\n",
    "    Extract numerical features from an invoice for fraud detection.\n",
    "    \n",
    "    Features extracted (36 total):\n",
    "    - Amount features (total, subtotal, tax, ratios)\n",
    "    - Pattern features (round numbers, invoice number format)\n",
    "    - Temporal features (date parsing, age)\n",
    "    - Completeness features (missing fields)\n",
    "    - Line item features (count, quantities, unit prices, calculation checks)\n",
    "    \"\"\"\n",
    "    features = {}\n",
    "    \n",
    "    # ===== AMOUNT FEATURES =====\n",
    "    total = float(invoice.get('totalAmount', 0) or 0)\n",
    "    subtotal = float(invoice.get('subtotalAmount', 0) or 0)\n",
    "    tax = float(invoice.get('taxAmount', 0) or 0)\n",
    "    \n",
    "    features['total'] = total\n",
    "    features['subtotal'] = subtotal\n",
    "    features['tax'] = tax\n",
    "    features['tax_ratio'] = tax / total if total > 0 else 0\n",
    "    features['amount_log'] = np.log1p(total)  # Log transform for skewed amounts\n",
    "    \n",
    "    # Round number detection (suspicious pattern)\n",
    "    features['is_round_100'] = 1 if total % 100 == 0 else 0\n",
    "    features['is_round_1000'] = 1 if total % 1000 == 0 else 0\n",
    "    features['is_round_500'] = 1 if total % 500 == 0 else 0\n",
    "    \n",
    "    # Decimal analysis\n",
    "    decimal_part = total - int(total)\n",
    "    features['has_cents'] = 1 if decimal_part > 0 else 0\n",
    "    features['cents_value'] = decimal_part\n",
    "    \n",
    "    # ===== INVOICE NUMBER FEATURES =====\n",
    "    inv_num = str(invoice.get('invoiceNumber', '') or '')\n",
    "    features['inv_num_length'] = len(inv_num)\n",
    "    features['inv_num_has_prefix'] = 1 if any(inv_num.upper().startswith(p) for p in ['INV', 'INVOICE', 'PO', 'REF']) else 0\n",
    "    features['inv_num_is_numeric'] = 1 if inv_num.isdigit() else 0\n",
    "    features['inv_num_missing'] = 1 if not inv_num.strip() else 0\n",
    "    \n",
    "    # ===== ISSUED TO FEATURES =====\n",
    "    issued_to = str(invoice.get('issuedTo', '') or '')\n",
    "    features['issued_to_length'] = len(issued_to)\n",
    "    features['issued_to_missing'] = 1 if not issued_to.strip() else 0\n",
    "    features['issued_to_is_generic'] = 1 if issued_to.lower() in ['cash', 'unknown', 'misc', 'various', ''] else 0\n",
    "    \n",
    "    # ===== DATE FEATURES =====\n",
    "    date_str = str(invoice.get('invoiceDate', '') or '')\n",
    "    features['date_missing'] = 1 if not date_str.strip() else 0\n",
    "    \n",
    "    try:\n",
    "        invoice_date = datetime.strptime(date_str, '%Y-%m-%d')\n",
    "        today = datetime.now()\n",
    "        \n",
    "        features['days_old'] = (today - invoice_date).days\n",
    "        features['is_future'] = 1 if invoice_date > today else 0\n",
    "        features['is_weekend'] = 1 if invoice_date.weekday() >= 5 else 0\n",
    "        features['month'] = invoice_date.month\n",
    "        features['day_of_week'] = invoice_date.weekday()\n",
    "        features['is_month_end'] = 1 if invoice_date.day >= 28 else 0\n",
    "    except:\n",
    "        features['days_old'] = -1  # Invalid date marker\n",
    "        features['is_future'] = 0\n",
    "        features['is_weekend'] = 0\n",
    "        features['month'] = 0\n",
    "        features['day_of_week'] = -1\n",
    "        features['is_month_end'] = 0\n",
    "    \n",
    "    # ===== LINE ITEMS FEATURES =====\n",
    "    line_items = invoice.get('lineItems', [])\n",
    "    line_count = len(line_items) if line_items else 0\n",
    "    features['line_item_count'] = line_count\n",
    "    features['has_line_items'] = 1 if line_count > 0 else 0\n",
    "    features['avg_line_item_value'] = total / line_count if line_count > 0 else total\n",
    "    \n",
    "    # ===== QUANTITY & UNIT PRICE FEATURES =====\n",
    "    quantities = []\n",
    "    unit_prices = []\n",
    "    calculation_errors = 0\n",
    "    \n",
    "    for item in line_items:\n",
    "        qty = item.get('quantity', 1)\n",
    "        unit_price = item.get('unit_price', item.get('amount', 0))\n",
    "        item_amount = item.get('amount', 0)\n",
    "        \n",
    "        quantities.append(qty)\n",
    "        unit_prices.append(unit_price)\n",
    "        \n",
    "        # Check calculation: qty × unit_price ≈ amount\n",
    "        expected = qty * unit_price\n",
    "        if abs(expected - item_amount) > 0.02:\n",
    "            calculation_errors += 1\n",
    "    \n",
    "    features['max_quantity'] = max(quantities) if quantities else 1\n",
    "    features['avg_quantity'] = np.mean(quantities) if quantities else 1\n",
    "    features['max_unit_price'] = max(unit_prices) if unit_prices else total\n",
    "    features['avg_unit_price'] = np.mean(unit_prices) if unit_prices else total\n",
    "    features['calculation_mismatches'] = calculation_errors\n",
    "    \n",
    "    # Single item dominance\n",
    "    if line_items and total > 0:\n",
    "        max_item_amount = max(item.get('amount', 0) for item in line_items)\n",
    "        features['single_item_dominance'] = max_item_amount / total\n",
    "    else:\n",
    "        features['single_item_dominance'] = 1.0\n",
    "    \n",
    "    features['has_high_quantity'] = 1 if features['max_quantity'] > 100 else 0\n",
    "    \n",
    "    # ===== COMPLETENESS SCORE =====\n",
    "    required_fields = ['invoiceNumber', 'issuedTo', 'totalAmount', 'invoiceDate']\n",
    "    missing_count = sum(1 for f in required_fields if not invoice.get(f))\n",
    "    features['missing_fields_count'] = missing_count\n",
    "    features['completeness_score'] = 1 - (missing_count / len(required_fields))\n",
    "    \n",
    "    return features\n",
    "\n",
    "\n",
    "# Test feature extraction on one row\n",
    "sample_invoice = df.iloc[0].to_dict()\n",
    "print(\"Sample invoice:\")\n",
    "print(json.dumps(sample_invoice, indent=2, default=str))\n",
    "print(\"\\nExtracted features:\")\n",
    "sample_features = extract_features(sample_invoice)\n",
    "for k, v in sample_features.items():\n",
    "    print(f\"  {k}: {v}\")"
]

# New source code for Export Feature Extractor
# Update logic in the exported string
FEATURE_EXTRACTOR_EXPORT_SOURCE = [
    "# Export feature extractor as a Python module\n",
    "FEATURE_EXTRACTOR_CODE = '''\"\"\"\n",
    "Feature Extractor for Fraud Detection Model\n",
    "Auto-generated from training notebook - 36 features including qty/unit_price\n",
    "\"\"\"\n",
    "\n",
    "import numpy as np\n",
    "from datetime import datetime\n",
    "from typing import Dict, Any, List\n",
    "\n",
    "# Feature names expected by the model (must match training order)\n",
    "FEATURE_NAMES = {feature_names}\n",
    "\n",
    "def extract_features(invoice: Dict[str, Any]) -> Dict[str, float]:\n",
    "    \"\"\"Extract 36 numerical features from an invoice for fraud detection.\"\"\"\n",
    "    features = {{}}\n",
    "    \n",
    "    # ===== AMOUNT FEATURES =====\n",
    "    total = float(invoice.get('totalAmount', 0) or invoice.get('total', 0) or 0)\n",
    "    subtotal = float(invoice.get('subtotalAmount', 0) or invoice.get('subtotal', 0) or 0)\n",
    "    tax = float(invoice.get('taxAmount', 0) or invoice.get('tax', 0) or 0)\n",
    "    \n",
    "    features['total'] = total\n",
    "    features['subtotal'] = subtotal\n",
    "    features['tax'] = tax\n",
    "    features['tax_ratio'] = tax / total if total > 0 else 0\n",
    "    features['amount_log'] = np.log1p(total)\n",
    "    \n",
    "    features['is_round_100'] = 1 if total % 100 == 0 else 0\n",
    "    features['is_round_1000'] = 1 if total % 1000 == 0 else 0\n",
    "    features['is_round_500'] = 1 if total % 500 == 0 else 0\n",
    "    \n",
    "    decimal_part = total - int(total)\n",
    "    features['has_cents'] = 1 if decimal_part > 0 else 0\n",
    "    features['cents_value'] = decimal_part\n",
    "    \n",
    "    # ===== INVOICE NUMBER FEATURES =====\n",
    "    inv_num = str(invoice.get('invoiceNumber', '') or '')\n",
    "    features['inv_num_length'] = len(inv_num)\n",
    "    features['inv_num_has_prefix'] = 1 if any(inv_num.upper().startswith(p) for p in ['INV', 'INVOICE', 'PO', 'REF']) else 0\n",
    "    features['inv_num_is_numeric'] = 1 if inv_num.isdigit() else 0\n",
    "    features['inv_num_missing'] = 1 if not inv_num.strip() else 0\n",
    "    \n",
    "    # ===== ISSUED TO FEATURES =====\n",
    "    issued_to = str(invoice.get('issuedTo', '') or '')\n",
    "    features['issued_to_length'] = len(issued_to)\n",
    "    features['issued_to_missing'] = 1 if not issued_to.strip() else 0\n",
    "    features['issued_to_is_generic'] = 1 if issued_to.lower() in ['cash', 'unknown', 'misc', 'various', ''] else 0\n",
    "    \n",
    "    # ===== DATE FEATURES =====\n",
    "    date_str = str(invoice.get('invoiceDate', '') or '')\n",
    "    features['date_missing'] = 1 if not date_str.strip() else 0\n",
    "    \n",
    "    try:\n",
    "        invoice_date = datetime.strptime(date_str, '%Y-%m-%d')\n",
    "        today = datetime.now()\n",
    "        \n",
    "        features['days_old'] = (today - invoice_date).days\n",
    "        features['is_future'] = 1 if invoice_date > today else 0\n",
    "        features['is_weekend'] = 1 if invoice_date.weekday() >= 5 else 0\n",
    "        features['month'] = invoice_date.month\n",
    "        features['day_of_week'] = invoice_date.weekday()\n",
    "        features['is_month_end'] = 1 if invoice_date.day >= 28 else 0\n",
    "    except:\n",
    "        features['days_old'] = -1\n",
    "        features['is_future'] = 0\n",
    "        features['is_weekend'] = 0\n",
    "        features['month'] = 0\n",
    "        features['day_of_week'] = -1\n",
    "        features['is_month_end'] = 0\n",
    "    \n",
    "    # ===== LINE ITEMS FEATURES =====\n",
    "    line_items = invoice.get('lineItems', [])\n",
    "    line_count = len(line_items) if line_items else 0\n",
    "    features['line_item_count'] = line_count\n",
    "    features['has_line_items'] = 1 if line_count > 0 else 0\n",
    "    features['avg_line_item_value'] = total / line_count if line_count > 0 else total\n",
    "    \n",
    "    # ===== QUANTITY & UNIT PRICE FEATURES =====\n",
    "    quantities = []\n",
    "    unit_prices = []\n",
    "    calculation_errors = 0\n",
    "    \n",
    "    for item in line_items:\n",
    "        qty = item.get('quantity', 1)\n",
    "        unit_price = item.get('unit_price', item.get('amount', 0))\n",
    "        item_amount = item.get('amount', 0)\n",
    "        \n",
    "        quantities.append(qty)\n",
    "        unit_prices.append(unit_price)\n",
    "        \n",
    "        expected = qty * unit_price\n",
    "        if abs(expected - item_amount) > 0.02:\n",
    "            calculation_errors += 1\n",
    "    \n",
    "    features['max_quantity'] = max(quantities) if quantities else 1\n",
    "    features['avg_quantity'] = np.mean(quantities) if quantities else 1\n",
    "    features['max_unit_price'] = max(unit_prices) if unit_prices else total\n",
    "    features['avg_unit_price'] = np.mean(unit_prices) if unit_prices else total\n",
    "    features['calculation_mismatches'] = calculation_errors\n",
    "    \n",
    "    if line_items and total > 0:\n",
    "        max_item_amount = max(item.get('amount', 0) for item in line_items)\n",
    "        features['single_item_dominance'] = max_item_amount / total\n",
    "    else:\n",
    "        features['single_item_dominance'] = 1.0\n",
    "    \n",
    "    features['has_high_quantity'] = 1 if features['max_quantity'] > 100 else 0\n",
    "    \n",
    "    # ===== COMPLETENESS SCORE =====\n",
    "    required_fields = ['invoiceNumber', 'issuedTo', 'totalAmount', 'invoiceDate']\n",
    "    missing_count = sum(1 for f in required_fields if not invoice.get(f))\n",
    "    features['missing_fields_count'] = missing_count\n",
    "    features['completeness_score'] = 1 - (missing_count / len(required_fields))\n",
    "    \n",
    "    return features\n",
    "\n",
    "\n",
    "def extract_feature_vector(invoice: Dict[str, Any]) -> List[float]:\n",
    "    \"\"\"Extract features as an ordered list matching model training order.\"\"\"\n",
    "    features = extract_features(invoice)\n",
    "    return [features.get(name, 0) for name in FEATURE_NAMES]\n",
    "'''.format(feature_names=feature_columns)\n",
    "\n",
    "# Save feature extractor\n",
    "EXTRACTOR_PATH = \"feature_extractor.py\"\n",
    "with open(EXTRACTOR_PATH, 'w') as f:\n",
    "    f.write(FEATURE_EXTRACTOR_CODE)\n",
    "\n",
    "print(f\"✅ Feature extractor saved to: {EXTRACTOR_PATH}\")\n",
    "print(f\"   Total features: 36 (includes qty/unit_price)\")\n",
    "print(f\"\\nUsage in fraud detection layer:\")\n",
    "print(\"  from feature_extractor import extract_feature_vector\")\n",
    "print(\"  features = extract_feature_vector(invoice_data)\")\n",
    "print(\"  prediction = model.predict([features])\")"
]

# New source code for Feature Extraction Loop
FEATURE_EXTRACTION_LOOP_SOURCE = [
    "# Extract features for all invoices\n",
    "print(\"Extracting features for all invoices...\")\n",
    "\n",
    "feature_list = []\n",
    "for idx, row in df.iterrows():\n",
    "    features = extract_features(row.to_dict())\n",
    "    features['reviewDecision'] = row['reviewDecision']  # Keep label for training\n",
    "    feature_list.append(features)\n",
    "\n",
    "# Create features DataFrame\n",
    "df_features = pd.DataFrame(feature_list)\n",
    "\n",
    "print(f\"✅ Extracted {len(df_features.columns) - 1} features from {len(df_features)} invoices\")\n",
    "print(f\"\\nFeature columns (36 features):\")\n",
    "print([c for c in df_features.columns if c != 'reviewDecision'])\n",
    "\n",
    "df_features.head()"
]

# New source code for Data Preparation
DATA_PREPARATION_SOURCE = [
    "# Prepare X (features) and y (labels)\n",
    "feature_columns = [c for c in df_features.columns if c != 'reviewDecision']\n",
    "X = df_features[feature_columns]\n",
    "y = (df_features['reviewDecision'] == 'rejected').astype(int)  # 1 = fraud (rejected), 0 = legitimate (approved)\n",
    "\n",
    "print(f\"Feature matrix shape: {X.shape}\")\n",
    "print(f\"Label vector shape: {y.shape}\")\n",
    "print(f\"Total features: {len(feature_columns)}\")\n",
    "print(f\"\\nLabel distribution:\")\n",
    "print(f\"  Legitimate (0): {(y == 0).sum()}\")\n",
    "print(f\"  Fraud (1): {(y == 1).sum()}\")\n",
    "print(f\"  Fraud rate: {y.mean() * 100:.2f}%\")\n",
    "\n",
    "# Train/Test split with stratification to maintain class balance\n",
    "X_train, X_test, y_train, y_test = train_test_split(\n",
    "    X, y, \n",
    "    test_size=0.2, \n",
    "    random_state=42, \n",
    "    stratify=y  # Maintain class proportions\n",
    ")\n",
    "\n",
    "print(f\"\\n✅ Train/Test Split Complete:\")\n",
    "print(f\"  Training set: {len(X_train)} samples ({(y_train == 1).sum()} fraud)\")\n",
    "print(f\"  Test set: {len(X_test)} samples ({(y_test == 1).sum()} fraud)\")"
]

# New source code for Imports
IMPORTS_SOURCE = [
    "# Core libraries\n",
    "import json\n",
    "import pickle\n",
    "import joblib\n",
    "import time\n",
    "import numpy as np\n",
    "import pandas as pd\n",
    "from datetime import datetime\n",
    "from pathlib import Path\n",
    "\n",
    "# Machine Learning\n",
    "from sklearn.ensemble import RandomForestClassifier\n",
    "from sklearn.model_selection import train_test_split, cross_val_score\n",
    "from sklearn.metrics import (\n",
    "    accuracy_score, \n",
    "    precision_score, \n",
    "    recall_score, \n",
    "    f1_score,\n",
    "    confusion_matrix, \n",
    "    classification_report,\n",
    "    roc_curve, \n",
    "    auc,\n",
    "    roc_auc_score, \n",
    "    precision_recall_curve\n",
    ")\n",
    "from sklearn.preprocessing import StandardScaler\n",
    "\n",
    "# Visualization\n",
    "import matplotlib.pyplot as plt\n",
    "import seaborn as sns\n",
    "\n",
    "# Set style\n",
    "plt.style.use('seaborn-v0_8-whitegrid')\n",
    "sns.set_palette(\"husl\")\n",
    "\n",
    "print(\"✅ Libraries imported successfully!\")"
]

def main():
    with open(NOTEBOOK_PATH, 'r', encoding='utf-8') as f:
        nb = json.load(f)

    cells = nb['cells']
    
    # Update Imports Cell
    for cell in cells:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "# Core libraries" in source and "import json" in source:
                print("Updating Imports cell...")
                cell['source'] = IMPORTS_SOURCE

    # Update Synthetic Data Cell
    for cell in cells:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "Creating sample synthetic dataset" in source:
                print("Updating Synthetic Data Generation cell...")
                cell['source'] = SYNTHETIC_DATA_SOURCE

    # Update EDA Cell
    for cell in cells:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "Dataset statistics" in source and "df.describe()" in source:
                print("Updating EDA cell...")
                cell['source'] = EDA_SOURCE
                
    # Update Feature Extraction Cell
    for cell in cells:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "def extract_features(invoice: dict)" in source:
                print("Updating Feature Extraction cell...")
                cell['source'] = FEATURE_EXTRACTION_SOURCE

    # Update Data Prep Cell
    for cell in cells:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "# Prepare X (features) and y (labels)" in source:
                print("Updating Data Preparation cell...")
                cell['source'] = DATA_PREPARATION_SOURCE
                
    # Update Feature Loop Cell
    for cell in cells:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "# Extract features for all invoices" in source:
                print("Updating Feature Extraction Loop cell...")
                cell['source'] = FEATURE_EXTRACTION_LOOP_SOURCE

    # Update Export Cell
    for cell in cells:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if "Export feature extractor as a Python module" in source:
                print("Updating Export cell...")
                # Also update the export code to handle reviewDecision if needed, or just keep as is since it extracts features.
                # But wait, the export code prints 'total features', making sure it aligns.
                cell['source'] = FEATURE_EXTRACTOR_EXPORT_SOURCE

    with open(NOTEBOOK_PATH, 'w', encoding='utf-8') as f:
        json.dump(nb, f, indent=1)
    
    print(f"✅ Notebook updated successfully: {NOTEBOOK_PATH}")

if __name__ == "__main__":
    main()
