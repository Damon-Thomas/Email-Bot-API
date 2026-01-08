#!/bin/bash

echo "🔍 Testing Gmail Error Handling Scenarios"
echo "========================================="

API_URL="http://localhost:3000"
# Note: Using the correct API key from .env
API_KEY="405c8f1bb8bda5ca29a602c8378db443c284849cdf8209ae17e0bd99229b3cb1"

echo ""
echo "✅ SUCCESS CASE: Valid email (should return success: true)"
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"to":"damon.h.thomas@gmail.com","subject":"Success Test","text":"This should succeed"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "❌ GMAIL ERROR SIMULATION: Testing large attachment (size limit)"
# Create a large base64 string to simulate oversized attachment
LARGE_CONTENT=$(openssl rand -base64 15728640 2>/dev/null | head -c 2000000 || echo "VGhpcyBpcyBhIGxhcmdlIGF0dGFjaG1lbnQ=")

curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{\"to\":\"damon.h.thomas@gmail.com\",\"subject\":\"Large Email Test\",\"text\":\"Testing size limits\",\"attachments\":[{\"filename\":\"large.txt\",\"content\":\"$LARGE_CONTENT\",\"encoding\":\"base64\"}]}" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "❌ VALIDATION ERROR: Invalid email format (should return success: false)"
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"to":"not-an-email","subject":"Invalid Email Test","text":"This should fail validation"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "❌ MISSING CONTENT: Email with no text or HTML (should return success: false)"
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"to":"damon.h.thomas@gmail.com","subject":"No Content Test"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "🔒 AUTH ERROR: Wrong API key (should return success: false)"
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-api-key-123" \
  -d '{"to":"damon.h.thomas@gmail.com","subject":"Auth Test","text":"Should fail"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ Test complete! Key observations:"
echo "   • success: true  = Email sent successfully"
echo "   • success: false = Any failure (Gmail errors, validation, auth, etc.)"
echo "   • Enhanced error messages provide specific failure reasons"
echo "   • HTTP status codes indicate error categories"