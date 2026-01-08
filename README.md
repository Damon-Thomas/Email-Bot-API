# Mailer API

A secure Node.js Express API for sending emails via the Brevo HTTP API. Perfect for contact forms, notifications, and transactional emails.

## Features

- ✅ Send emails via REST API using Brevo
- ✅ API key authentication for security
- ✅ Domain whitelisting to prevent unauthorized access
- ✅ Rate limiting (5 requests per minute per IP)
- ✅ Input validation
- ✅ TypeScript support
- ✅ Comprehensive error handling and logging
- ✅ Health check endpoint
- ✅ CORS protection
- ✅ Support for HTML and plain text emails

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Brevo Configuration (get your API key from https://app.brevo.com/settings/keys/api)
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_FROM_EMAIL=your-verified-email@example.com
BREVO_FROM_NAME=Your App Name

# Security
API_KEY=your-secure-api-key-here
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
ALLOWED_DOMAINS=yourdomain.com,localhost
```

### 3. Run the Server

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

### 4. Test the API

```bash
curl -X POST http://localhost:3000/api/mail/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from Mailer API",
    "text": "This is a test email!"
  }'
```

---

## API Reference

### Health Check

```
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-08T12:00:00.000Z"
}
```

### Send Email

```
POST /api/mail/send
```

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `X-API-Key` | Yes | Your API key for authentication |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject line |
| `text` | string | No* | Plain text email body |
| `html` | string | No* | HTML email body |

\*At least one of `text` or `html` is required.

**Success Response (200):**

```json
{
  "success": true,
  "messageId": "<202601080530.12345@smtp-relay.mailin.fr>",
  "message": "Email sent successfully"
}
```

**Error Response (4xx/5xx):**

```json
{
  "success": false,
  "error": "Failed to send email",
  "message": "Error description",
  "errorType": "API_ERROR"
}
```

---

## Frontend Integration

### React Contact Form Component

Copy and paste this ready-to-use React component:

```tsx
// ContactForm.tsx
import React, { useState } from "react";

interface ContactFormProps {
  apiUrl: string; // Your Mailer API URL (e.g., "https://your-api.railway.app")
  apiKey: string; // Your API key
  toEmail: string; // Recipient email address
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactForm: React.FC<ContactFormProps> = ({
  apiUrl,
  apiKey,
  toEmail,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`${apiUrl}/api/mail/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          to: toEmail,
          subject: `Contact Form: ${formData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <h3>Message:</h3>
            <p>${formData.message.replace(/\n/g, "<br>")}</p>
          `,
          text: `
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}
          `,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
        onSuccess?.();
      } else {
        throw new Error(data.message || "Failed to send email");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      setStatus("error");
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      {status === "success" && (
        <div className="alert alert-success">
          ✅ Message sent successfully! We'll get back to you soon.
        </div>
      )}

      {status === "error" && (
        <div className="alert alert-error">❌ {errorMessage}</div>
      )}

      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject">Subject *</label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">Message *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          required
          disabled={isSubmitting}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
};

export default ContactForm;
```

**Usage Example:**

```tsx
// App.tsx or your page component
import ContactForm from "./ContactForm";

function ContactPage() {
  return (
    <div>
      <h1>Contact Us</h1>
      <ContactForm
        apiUrl="https://your-mailer-api.railway.app"
        apiKey="your-api-key-here"
        toEmail="contact@yourdomain.com"
        onSuccess={() => console.log("Email sent!")}
        onError={(err) => console.error("Error:", err)}
      />
    </div>
  );
}
```

**Basic CSS:**

```css
.contact-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

button[type="submit"] {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button[type="submit"]:hover:not(:disabled) {
  background-color: #0056b3;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
```

---

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Contact Form</title>
  </head>
  <body>
    <form id="contactForm">
      <input type="text" name="name" placeholder="Your Name" required />
      <input type="email" name="email" placeholder="Your Email" required />
      <input type="text" name="subject" placeholder="Subject" required />
      <textarea name="message" placeholder="Your Message" required></textarea>
      <button type="submit">Send</button>
      <div id="status"></div>
    </form>

    <script>
      const API_URL = "https://your-mailer-api.railway.app";
      const API_KEY = "your-api-key-here";
      const TO_EMAIL = "contact@yourdomain.com";

      document
        .getElementById("contactForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const form = e.target;
          const status = document.getElementById("status");
          const button = form.querySelector("button");

          const formData = new FormData(form);
          button.disabled = true;
          button.textContent = "Sending...";
          status.textContent = "";

          try {
            const response = await fetch(`${API_URL}/api/mail/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": API_KEY,
              },
              body: JSON.stringify({
                to: TO_EMAIL,
                subject: `Contact: ${formData.get("subject")}`,
                html: `
              <p><strong>Name:</strong> ${formData.get("name")}</p>
              <p><strong>Email:</strong> ${formData.get("email")}</p>
              <p><strong>Message:</strong><br>${formData.get("message")}</p>
            `,
              }),
            });

            const data = await response.json();

            if (data.success) {
              status.innerHTML =
                '<span style="color: green;">✅ Message sent!</span>';
              form.reset();
            } else {
              throw new Error(data.message);
            }
          } catch (error) {
            status.innerHTML = `<span style="color: red;">❌ ${error.message}</span>`;
          } finally {
            button.disabled = false;
            button.textContent = "Send";
          }
        });
    </script>
  </body>
</html>
```

---

## Security Configuration

### 1. API Key Authentication

All requests must include the `X-API-Key` header with a valid API key.

Generate a secure API key:

```bash
openssl rand -hex 32
```

### 2. Domain Whitelisting

Configure `ALLOWED_DOMAINS` in your `.env` to restrict which domains can use your API:

```env
ALLOWED_DOMAINS=yourdomain.com,www.yourdomain.com
```

### 3. CORS Configuration

Configure `ALLOWED_ORIGINS` to specify which origins can make requests:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. Rate Limiting

Default: 5 requests per minute per IP address. Configure in `.env`:

```env
RATE_LIMIT_POINTS=5
RATE_LIMIT_DURATION=60
```

---

## Deployment

### Railway

1. Push your code to GitHub
2. Connect your repo to [Railway](https://railway.app)
3. Add environment variables in Railway dashboard
4. Deploy!

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
BREVO_API_KEY=xkeysib-your-production-key
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=Your App
API_KEY=your-secure-production-api-key
ALLOWED_ORIGINS=https://yourdomain.com
ALLOWED_DOMAINS=yourdomain.com
```

---

## Error Codes

| Error Type         | Description                |
| ------------------ | -------------------------- |
| `AUTH_ERROR`       | Invalid or missing API key |
| `VALIDATION_ERROR` | Invalid request data       |
| `QUOTA_ERROR`      | Rate limit exceeded        |
| `API_ERROR`        | Brevo API error            |
| `NETWORK_ERROR`    | Connection issues          |

---

## License

MIT
