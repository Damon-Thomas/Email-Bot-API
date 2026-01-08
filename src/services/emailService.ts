import { logger } from "../utils/logger.js";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    encoding?: string;
  }>;
}

interface EmailResult {
  messageId: string;
}

interface BrevoRecipient {
  email: string;
  name?: string;
}

interface BrevoEmailPayload {
  sender: { email: string; name: string };
  to: BrevoRecipient[];
  subject: string;
  textContent?: string;
  htmlContent?: string;
  attachment?: Array<{ name: string; content: string }>;
}

class EmailService {
  private getConfig() {
    return {
      apiKey: process.env.BREVO_API_KEY || "",
      fromEmail: process.env.BREVO_FROM_EMAIL || "",
      fromName: process.env.BREVO_FROM_NAME || "Mailer API",
    };
  }

  private validateConfig(): void {
    const { apiKey, fromEmail } = this.getConfig();
    if (!apiKey) {
      throw new Error(
        "Brevo configuration missing. Please provide BREVO_API_KEY environment variable."
      );
    }
    if (!fromEmail) {
      throw new Error(
        "Brevo configuration missing. Please provide BREVO_FROM_EMAIL environment variable."
      );
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      this.validateConfig();
      const { apiKey, fromEmail, fromName } = this.getConfig();

      // Prepare recipient list
      const recipients: BrevoRecipient[] = Array.isArray(options.to)
        ? options.to.map((email) => ({ email }))
        : [{ email: options.to }];

      // Prepare email payload
      const payload: BrevoEmailPayload = {
        sender: {
          email: fromEmail,
          name: fromName,
        },
        to: recipients,
        subject: options.subject,
      };

      if (options.text) {
        payload.textContent = options.text;
      }
      if (options.html) {
        payload.htmlContent = options.html;
      }

      // Handle attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        payload.attachment = options.attachments.map((att) => ({
          name: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString("base64")
            : att.content,
        }));
      }

      // Send email via Brevo HTTP API using fetch
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        messageId?: string;
        message?: string;
        code?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP ${response.status}: ${data.code}`
        );
      }

      logger.info("Email sent successfully via Brevo HTTP API", {
        messageId: data.messageId,
        to: options.to,
        subject: options.subject,
      });

      return { messageId: data.messageId || "unknown" };
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.body?.message || "Unknown error";
      const errorCode = error?.response?.statusCode || error?.statusCode;

      // Enhanced error categorization for better user feedback
      let userFriendlyMessage = errorMessage;
      let errorType = "API_ERROR";

      if (errorCode === 401 || errorMessage.includes("unauthorized")) {
        userFriendlyMessage =
          "Brevo authentication failed. Please check your API key.";
        errorType = "AUTH_ERROR";
      } else if (
        errorCode === 400 ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("email")
      ) {
        userFriendlyMessage = "Invalid email address or request data.";
        errorType = "VALIDATION_ERROR";
      } else if (
        errorCode === 413 ||
        errorMessage.includes("too large") ||
        errorMessage.includes("size limit")
      ) {
        userFriendlyMessage =
          "Email message is too large. Please reduce size or attachments.";
        errorType = "SIZE_ERROR";
      } else if (
        errorCode === 429 ||
        errorMessage.includes("quota") ||
        errorMessage.includes("rate limit")
      ) {
        userFriendlyMessage =
          "Daily sending limit reached. Please try again later.";
        errorType = "QUOTA_ERROR";
      } else if (
        errorCode >= 500 ||
        errorMessage.includes("connection") ||
        errorMessage.includes("timeout")
      ) {
        userFriendlyMessage = "Brevo service error. Please try again.";
        errorType = "NETWORK_ERROR";
      } else if (
        errorMessage.includes("spam") ||
        errorMessage.includes("blocked")
      ) {
        userFriendlyMessage =
          "Email was blocked by spam filters or policy restrictions.";
        errorType = "POLICY_ERROR";
      }

      logger.error("Failed to send email via Brevo HTTP API", {
        error: errorMessage,
        errorType,
        errorCode,
        to: options.to,
        subject: options.subject,
      });

      // Create enhanced error object
      const enhancedError = new Error(userFriendlyMessage);
      (enhancedError as any).originalError = errorMessage;
      (enhancedError as any).errorType = errorType;
      (enhancedError as any).errorCode = errorCode;

      throw enhancedError;
    }
  }
}

// Export singleton instance
const emailService = new EmailService();
export const sendEmail = (options: EmailOptions) =>
  emailService.sendEmail(options);
