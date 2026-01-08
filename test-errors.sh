#!/bin/bash

echo "🧪 Testing Mailer API Error Handling"
echo "==================================="

API_URL="http://localhost:3000"
API_KEY="048044a4551d367b92da6544e23e1ec0d2f8ece189e3f1bce31aaf74d9828f38"

echo ""
echo "1️⃣  Testing invalid email format..."
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"to":"not-an-email","subject":"Test","text":"Should fail validation"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "2️⃣  Testing missing required fields..."
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"to":"test@example.com","subject":""}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "3️⃣  Testing valid email (should succeed)..."
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"to":"damon.h.thomas@gmail.com","subject":"Error Handling Test","text":"This should succeed and return success: true"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "4️⃣  Testing without API key..."
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","text":"Should fail auth"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "5️⃣  Testing wrong API key..."
curl -X POST $API_URL/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{"to":"test@example.com","subject":"Test","text":"Should fail auth"}' \
  -w "\nStatus: %{http_code}\n" \
  -s

echo ""
echo "✅ Error handling test complete!"