import nodemailer from "nodemailer";
import { google } from "googleapis";
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

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      // Check if OAuth2 credentials are provided
      const hasOAuth2 =
        process.env.GMAIL_CLIENT_ID &&
        process.env.GMAIL_CLIENT_SECRET &&
        process.env.GMAIL_REFRESH_TOKEN;

      // Check if app password is provided
      const hasAppPassword = process.env.GMAIL_APP_PASSWORD;

      if (hasOAuth2) {
        // Gmail OAuth2 setup
        const oauth2Client = new google.auth.OAuth2(
          process.env.GMAIL_CLIENT_ID,
          process.env.GMAIL_CLIENT_SECRET,
          "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
          refresh_token: process.env.GMAIL_REFRESH_TOKEN || null,
        });

        const accessToken = await oauth2Client.getAccessToken();

        this.transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: process.env.GMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken.token,
          },
          tls: {
            rejectUnauthorized: false,
          },
        } as nodemailer.TransportOptions);

        logger.info("Using Gmail OAuth2 authentication");
      } else if (hasAppPassword) {
        // Gmail App Password setup (simpler)
        this.transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        logger.info("Using Gmail App Password authentication");
      } else {
        throw new Error(
          "No valid Gmail authentication method configured. Please provide either OAuth2 credentials or an app password."
        );
      }

      // Verify the connection
      if (this.transporter) {
        await this.transporter.verify();
        logger.info("Gmail transporter created and verified successfully");
      }

      return this.transporter as nodemailer.Transporter;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to create Gmail transporter", {
        error: errorMessage,
      });
      throw new Error("Failed to setup email service: " + errorMessage);
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: `${process.env.GMAIL_FROM_NAME || "Mailer API"} <${
          process.env.GMAIL_USER
        }>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return { messageId: result.messageId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Enhanced error categorization for better user feedback
      let userFriendlyMessage = errorMessage;
      let errorType = "SMTP_ERROR";

      if (
        errorMessage.includes("Invalid login") ||
        errorMessage.includes("authentication failed")
      ) {
        userFriendlyMessage =
          "Gmail authentication failed. Please check your credentials.";
        errorType = "AUTH_ERROR";
      } else if (
        errorMessage.includes("Recipient address rejected") ||
        errorMessage.includes("invalid address")
      ) {
        userFriendlyMessage = "Invalid recipient email address.";
        errorType = "RECIPIENT_ERROR";
      } else if (
        errorMessage.includes("Message too large") ||
        errorMessage.includes("size limit")
      ) {
        userFriendlyMessage =
          "Email message is too large. Please reduce size or attachments.";
        errorType = "SIZE_ERROR";
      } else if (
        errorMessage.includes("Daily sending quota") ||
        errorMessage.includes("rate limit")
      ) {
        userFriendlyMessage =
          "Gmail daily sending limit reached. Please try again later.";
        errorType = "QUOTA_ERROR";
      } else if (
        errorMessage.includes("connection") ||
        errorMessage.includes("timeout")
      ) {
        userFriendlyMessage = "Network connection error. Please try again.";
        errorType = "NETWORK_ERROR";
      } else if (
        errorMessage.includes("spam") ||
        errorMessage.includes("blocked")
      ) {
        userFriendlyMessage =
          "Email was blocked by spam filters or policy restrictions.";
        errorType = "POLICY_ERROR";
      }

      logger.error("Failed to send email", {
        error: errorMessage,
        errorType,
        to: options.to,
        subject: options.subject,
      });

      // Create enhanced error object
      const enhancedError = new Error(userFriendlyMessage);
      (enhancedError as any).originalError = errorMessage;
      (enhancedError as any).errorType = errorType;

      throw enhancedError;
    }
  }

  // Reset transporter (useful for refreshing credentials)
  resetTransporter(): void {
    this.transporter = null;
    logger.info("Email transporter reset");
  }
}

// Export singleton instance
const emailService = new EmailService();
export const sendEmail = (options: EmailOptions) =>
  emailService.sendEmail(options);
export const resetEmailService = () => emailService.resetTransporter();
