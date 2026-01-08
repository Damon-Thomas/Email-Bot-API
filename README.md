# Mailer API

A Node.js Express API for sending emails via Gmail using OAuth2 authentication.

## Features

- ✅ Send individual emails via REST API
- ✅ Bulk email sending (up to 10 emails per request)
- ✅ Gmail OAuth2 integration
- ✅ Rate limiting (5 requests per minute per IP)
- ✅ Input validation with Joi
- ✅ TypeScript support
- ✅ Comprehensive error handling and logging
- ✅ Health check endpoint
- ✅ CORS and security headers

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Gmail OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth2 credentials (Web application)
5. Add `https://developers.google.com/oauthplayground` to authorized redirect URIs
6. Go to [OAuth2 Playground](https://developers.google.com/oauthplayground/)
7. Configure it to use your own OAuth2 credentials
8. Authorize Gmail API v1 (https://www.googleapis.com/auth/gmail.send)
9. Exchange authorization code for tokens
10. Copy the refresh token

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

- `GMAIL_USER`: Your Gmail address
- `GMAIL_CLIENT_ID`: OAuth2 client ID
- `GMAIL_CLIENT_SECRET`: OAuth2 client secret
- `GMAIL_REFRESH_TOKEN`: OAuth2 refresh token
- `GMAIL_FROM_NAME`: Display name for sender

### 4. Run the Server

Development mode:

```bash
pnpm dev
```

Production mode:

```bash
pnpm build
pnpm start
```

## API Endpoints

### Health Check

```
GET /health
```

### Send Single Email

```
POST /api/mail/send

Body:
{
  "to": "recipient@example.com", // string or array of strings
  "subject": "Your subject",
  "text": "Plain text content", // optional if html is provided
  "html": "<h1>HTML content</h1>", // optional if text is provided
  "attachments": [ // optional
    {
      "filename": "document.pdf",
      "content": "base64-encoded-content",
      "encoding": "base64"
    }
  ]
}
```

### Send Bulk Emails

```
POST /api/mail/send-bulk

Body:
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Subject 1",
      "text": "Content 1"
    },
    {
      "to": "user2@example.com",
      "subject": "Subject 2",
      "html": "<p>Content 2</p>"
    }
  ]
}
```

## Rate Limiting

- 5 requests per minute per IP address
- Returns 429 status code when exceeded
- Includes `retryAfter` in response

## Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Development

The project uses:

- **Express.js** - Web framework
- **Nodemailer** - Email sending
- **Google APIs** - Gmail OAuth2
- **Joi** - Input validation
- **Helmet** - Security headers
- **TypeScript** - Type safety

## Security Features

- CORS enabled
- Rate limiting
- Input validation
- Security headers via Helmet
- OAuth2 authentication
- No sensitive data in logs

## Deployment

1. Build the project: `pnpm build`
2. Set NODE_ENV=production
3. Configure your environment variables
4. Run: `pnpm start`

## Logging

Logs include:

- Request information
- Email sending status
- Error details
- Performance metrics

In development: Human-readable console logs
In production: Structured JSON logs
# Email-Bot-API
