# 🔐 Mailer API Integration Guide

## Security Features Implemented

✅ **API Key Authentication** - All requests require `X-API-Key` header  
✅ **Domain Whitelisting** - Only allowed domains can make requests  
✅ **CORS Protection** - Configured origins in environment variables  
✅ **Rate Limiting** - 5 requests per minute per IP (configurable)  
✅ **Input Validation** - All email fields are validated  
✅ **Request Logging** - All attempts are logged for monitoring

## 🚀 Quick Setup

### 1. Configure Security Settings

Update your `.env` file with:

```env
# Generate a strong API key (use a password generator)
API_KEY=your-super-secure-api-key-change-this-now

# Add your website domains (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_DOMAINS=yourdomain.com

# Optional: Adjust rate limits
RATE_LIMIT_POINTS=10
RATE_LIMIT_DURATION=60
```

### 2. Generate a Secure API Key

```bash
# Generate a secure random API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📧 Frontend Integration Examples

### JavaScript/Fetch (Vanilla JS)

```javascript
async function sendEmail(emailData) {
  try {
    const response = await fetch("https://your-api-domain.com/api/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "your-api-key-here", // Store securely!
      },
      body: JSON.stringify({
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.message,
        html: `<p>${emailData.message}</p>`,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Email sent!", result.messageId);
      return { success: true, messageId: result.messageId };
    } else {
      console.error("Email failed:", result.message);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Network error:", error);
    return { success: false, error: "Network error" };
  }
}

// Usage
sendEmail({
  to: "customer@example.com",
  subject: "Welcome!",
  message: "Thanks for signing up!",
});
```

### React Hook Example

```jsx
import { useState } from "react";

const useEmailSender = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendEmail = async (emailData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        process.env.REACT_APP_MAILER_API_URL + "/api/mail/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.REACT_APP_MAILER_API_KEY,
          },
          body: JSON.stringify(emailData),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendEmail, loading, error };
};

// Component usage
const ContactForm = () => {
  const { sendEmail, loading, error } = useEmailSender();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await sendEmail({
        to: "contact@yourdomain.com",
        subject: `Contact from ${formData.get("name")}`,
        text: formData.get("message"),
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${formData.get("name")}</p>
          <p><strong>Email:</strong> ${formData.get("email")}</p>
          <p><strong>Message:</strong> ${formData.get("message")}</p>
        `,
      });
      alert("Email sent successfully!");
    } catch (err) {
      alert("Failed to send email: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Your Name" required />
      <input name="email" type="email" placeholder="Your Email" required />
      <textarea name="message" placeholder="Your Message" required></textarea>
      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Email"}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

### Node.js Backend Integration

```javascript
import axios from "axios";

class MailerService {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async sendEmail({ to, subject, text, html }) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/mail/send`,
        { to, subject, text, html },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Email sending failed");
    }
  }

  async sendBulkEmails(emails) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/mail/send-bulk`,
        { emails },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Bulk email sending failed"
      );
    }
  }
}

// Usage
const mailer = new MailerService(
  process.env.MAILER_API_URL,
  process.env.MAILER_API_KEY
);

// Send welcome email
await mailer.sendEmail({
  to: "user@example.com",
  subject: "Welcome to our platform!",
  html: "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
});
```

## 🛡️ Security Best Practices

### 1. API Key Management

**❌ Never do this:**

```javascript
// DON'T hardcode API keys in frontend code
const API_KEY = "abc123"; // Visible to anyone!
```

**✅ Do this instead:**

**Frontend (client-side):**

- Use environment variables: `process.env.REACT_APP_API_KEY`
- Store in secure configuration management
- Consider using a backend proxy to hide the API key

**Backend (server-side):**

```javascript
// Use environment variables
const API_KEY = process.env.MAILER_API_KEY;
```

### 2. Domain Configuration

```env
# Development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ALLOWED_DOMAINS=localhost

# Production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ALLOWED_DOMAINS=yourdomain.com
```

### 3. Rate Limiting

Adjust based on your needs:

```env
# Conservative (default)
RATE_LIMIT_POINTS=5
RATE_LIMIT_DURATION=60

# More generous for high-traffic sites
RATE_LIMIT_POINTS=20
RATE_LIMIT_DURATION=60
```

## 🔍 Testing & Monitoring

### Test Authentication

```bash
# Test without API key (should fail)
curl -X POST http://localhost:3000/api/mail/send \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","text":"Test"}'

# Test with API key (should work)
curl -X POST http://localhost:3000/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"to":"test@example.com","subject":"Test","text":"Test"}'
```

### Monitor Logs

Watch your server logs for:

- Authentication attempts
- Rate limiting hits
- Domain validation failures
- Successful email sends

## 🚨 Production Deployment

1. **Use HTTPS only** - Never send API keys over HTTP
2. **Set NODE_ENV=production** in your environment
3. **Configure proper CORS origins** for your domain
4. **Use strong API keys** (32+ characters, random)
5. **Set up monitoring** for failed requests
6. **Regular key rotation** - Change API keys periodically
7. **Rate limit monitoring** - Adjust limits based on usage patterns

## 📊 API Endpoints

| Endpoint              | Method | Auth Required | Description                   |
| --------------------- | ------ | ------------- | ----------------------------- |
| `/health`             | GET    | ❌            | Health check (no auth needed) |
| `/api/mail/send`      | POST   | ✅            | Send single email             |
| `/api/mail/send-bulk` | POST   | ✅            | Send up to 10 emails          |

## 🔧 Troubleshooting

### Common Errors

| Error                     | Cause                      | Solution                        |
| ------------------------- | -------------------------- | ------------------------------- |
| `Authentication required` | Missing `X-API-Key` header | Add API key header              |
| `Invalid API key`         | Wrong API key              | Check `.env` file               |
| `Not allowed by CORS`     | Domain not whitelisted     | Add domain to `ALLOWED_ORIGINS` |
| `Rate limit exceeded`     | Too many requests          | Wait or increase rate limits    |
| `Forbidden`               | Domain validation failed   | Add domain to `ALLOWED_DOMAINS` |

Your mailer API is now production-ready with enterprise-level security! 🎉
