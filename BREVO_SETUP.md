# 🚀 Brevo (Sendinblue) Setup Guide

## Why Brevo Instead of Gmail?

✅ **Cloud hosting friendly** - Works perfectly with Railway, Heroku, etc.  
✅ **Reliable delivery** - Better email deliverability  
✅ **No IP blocking** - Designed for server-to-server communication  
✅ **Higher limits** - More emails per day than Gmail  
✅ **Professional** - Better for business use

## Setup Steps

### 1. Create Brevo Account

1. Go to [Brevo.com](https://www.brevo.com/) (formerly Sendinblue)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Login to your Brevo dashboard
2. Go to **SMTP & API** → **API Keys**
3. Create a new API key
4. Copy the API key (it looks like: `xkeysib-...`)

### 3. Set Up Sender Email

1. Go to **Senders & IP** → **Senders**
2. Add your email address and verify it
3. Or use the default `noreply@yourdomain.com` format

### 4. Update Your Environment Variables

**Local development (.env):**

```env
BREVO_API_KEY=xkeysib-your-actual-api-key-here
BREVO_FROM_EMAIL=your-verified-email@yourdomain.com
BREVO_FROM_NAME=Your App Name
```

**Railway deployment:**

1. Go to your Railway project
2. Click **Variables** tab
3. Add the same environment variables

### 5. Test Your Setup

**Local test:**

```bash
curl -X POST http://localhost:3000/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"to":"test@example.com","subject":"Brevo Test","text":"Testing Brevo integration!"}'
```

**Live test:**

```bash
curl -X POST https://your-railway-app.up.railway.app/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"to":"test@example.com","subject":"Live Brevo Test","text":"Testing live Brevo!"}'
```

## Brevo Free Plan Limits

- **300 emails/day** (free plan)
- **Unlimited contacts**
- **Email templates**
- **Basic analytics**

## Troubleshooting

| Error                   | Solution                                   |
| ----------------------- | ------------------------------------------ |
| `Authentication failed` | Check your BREVO_API_KEY                   |
| `Invalid from address`  | Verify BREVO_FROM_EMAIL in Brevo dashboard |
| `Connection refused`    | Check BREVO_SMTP_HOST and BREVO_SMTP_PORT  |

Your API is now ready for reliable email sending with Brevo! 🎉
