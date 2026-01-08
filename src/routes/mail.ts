import express, { Router } from "express";
import { sendEmail } from "../services/emailService.js";
import { validateEmailRequest } from "../middleware/validation.js";
import { authenticateApiKey, validateDomain } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";

const router: Router = express.Router();

// Apply authentication and domain validation to all routes
router.use(authenticateApiKey);
router.use(validateDomain);

/**
 * POST /api/mail/send
 * Send an email via Gmail
 */
router.post("/send", validateEmailRequest, async (req, res) => {
  try {
    const { to, subject, text, html, attachments } = req.body;

    logger.info("Attempting to send email", { to, subject });

    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      attachments,
    });

    logger.info("Email sent successfully", { messageId: result.messageId, to });

    res.json({
      success: true,
      messageId: result.messageId,
      message: "Email sent successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const originalError = (error as any).originalError;
    const errorType = (error as any).errorType || "UNKNOWN";

    logger.error("Failed to send email", {
      error: errorMessage,
      originalError,
      errorType,
      to: req.body.to,
      subject: req.body.subject,
    });

    // Return appropriate HTTP status based on error type
    let statusCode = 500;
    if (errorType === "RECIPIENT_ERROR") statusCode = 400;
    if (errorType === "AUTH_ERROR") statusCode = 401;
    if (errorType === "QUOTA_ERROR") statusCode = 429;

    res.status(statusCode).json({
      success: false,
      error: "Failed to send email",
      message: errorMessage,
      errorType: errorType,
      // Include original error in development mode
      ...(process.env.NODE_ENV === "development" &&
        originalError && {
          originalError: originalError,
        }),
    });
  }
});

/**
 * POST /api/mail/send-bulk
 * Send multiple emails (with rate limiting)
 */
router.post("/send-bulk", async (req, res): Promise<void> => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        message: "emails must be a non-empty array",
      });
      return;
    }

    if (emails.length > 10) {
      res.status(400).json({
        success: false,
        error: "Too many emails",
        message: "Maximum 10 emails per bulk request",
      });
      return;
    }

    logger.info("Attempting to send bulk emails", { count: emails.length });

    const results = await Promise.allSettled(
      emails.map((email) => sendEmail(email))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - successful;

    logger.info("Bulk email results", {
      successful,
      failed,
      total: results.length,
    });

    res.json({
      success: true,
      results: {
        total: results.length,
        successful,
        failed,
        details: results.map((result, index) => ({
          index,
          status: result.status,
          messageId:
            result.status === "fulfilled" ? result.value.messageId : null,
          error: result.status === "rejected" ? result.reason.message : null,
        })),
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Bulk email operation failed", { error: errorMessage });

    res.status(500).json({
      success: false,
      error: "Bulk email operation failed",
      message: errorMessage,
    });
  }
});

export default router;
