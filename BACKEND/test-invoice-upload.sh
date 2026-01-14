#!/bin/bash

# Test script for Invoice Upload Endpoint
# Usage: ./test-invoice-upload.sh [TOKEN] [FILE_PATH]

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${1:-${TEST_TOKEN}}"
FILE_PATH="${2:-./test-invoice.pdf}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Invoice Upload Endpoint${NC}\n"
echo "Base URL: $BASE_URL"
echo "Endpoint: POST $BASE_URL/invoice/upload"
echo ""

# Check if token is provided
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ ERROR: Token is required${NC}"
    echo ""
    echo "Usage:"
    echo "  ./test-invoice-upload.sh YOUR_TOKEN [FILE_PATH]"
    echo ""
    echo "Or set environment variables:"
    echo "  export TEST_TOKEN=your_token_here"
    echo "  ./test-invoice-upload.sh"
    echo ""
    echo "To get a token:"
    echo "  1. Login via POST $BASE_URL/auth/login"
    echo "  2. Copy the token from the response"
    exit 1
fi

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${YELLOW}⚠️  Test file not found: $FILE_PATH${NC}"
    echo "Creating a dummy test file..."
    echo "This is a test invoice file for upload testing." > "$FILE_PATH"
    echo -e "${GREEN}✅ Created dummy file: $FILE_PATH${NC}\n"
fi

FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null)
echo "📄 File: $FILE_PATH ($FILE_SIZE bytes)"
echo ""

# Make the request
echo "📤 Sending upload request..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/invoice/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$FILE_PATH")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Response Status: $HTTP_CODE"
echo ""
echo "📥 Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo -e "${GREEN}✅ SUCCESS: Invoice uploaded successfully!${NC}"
    
    # Try to extract and display invoice details if jq is available
    if command -v jq &> /dev/null; then
        echo ""
        echo "📋 Invoice Details:"
        echo "$BODY" | jq -r '.data | "   ID: \(.id)\n   IPFS CID: \(.ipfsCid)\n   File Hash: \(.fileHashSha256)\n   Anchor Status: \(.anchorStatus)\n   Transaction Hash: \(.anchorTxHash // "N/A")\n   Anchored At: \(.anchoredAt // "N/A")"'
    fi
else
    echo -e "${RED}❌ FAILED: Upload request failed${NC}"
    if command -v jq &> /dev/null; then
        ERROR_MSG=$(echo "$BODY" | jq -r '.message // .error // "Unknown error"')
        ERROR_CODE=$(echo "$BODY" | jq -r '.code // "N/A"')
        echo "   Error: $ERROR_MSG"
        echo "   Code: $ERROR_CODE"
    fi
    exit 1
fi
