import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

// Extend Request type to include apiKey
declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}

export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers["x-api-key"] as string;
  const expectedApiKey = process.env.API_KEY?.trim();

  if (!expectedApiKey) {
    logger.warn("API_KEY not configured in environment variables");
    res.status(500).json({
      success: false,
      error: "Server configuration error",
      message: "API authentication not properly configured",
    });
    return;
  }

  if (!apiKey) {
    logger.warn("API request without API key", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "API key is required. Include 'X-API-Key' header.",
    });
    return;
  }

  const trimmedApiKey = apiKey.trim();

  if (trimmedApiKey !== expectedApiKey) {
    logger.warn("API request with invalid API key", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      providedKeyLength: trimmedApiKey.length,
      expectedKeyLength: expectedApiKey.length,
      providedKey: trimmedApiKey.substring(0, 8) + "***", // Log partial key for debugging
    });
    res.status(401).json({
      success: false,
      error: "Authentication failed",
      message: "Invalid API key provided",
    });
    return;
  }

  req.apiKey = trimmedApiKey;
  logger.info("API request authenticated", { ip: req.ip });
  next();
};

// Domain validation middleware
export const validateDomain = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const allowedDomains =
    process.env.ALLOWED_DOMAINS?.split(",").map((d) => d.trim()) || [];

  if (allowedDomains.length === 0 || allowedDomains.includes("localhost")) {
    // Skip domain validation in development or if no domains configured
    next();
    return;
  }

  const origin = req.get("Origin") || req.get("Referer");

  if (!origin) {
    logger.warn("API request without origin/referer", { ip: req.ip });
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Request must include valid origin",
    });
    return;
  }

  try {
    const url = new URL(origin);
    const domain = url.hostname;

    const isAllowed = allowedDomains.some(
      (allowedDomain) =>
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    );

    if (!isAllowed) {
      logger.warn("API request from unauthorized domain", {
        ip: req.ip,
        domain,
        origin,
      });
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Request from unauthorized domain",
      });
      return;
    }

    logger.info("Domain validation passed", { domain, ip: req.ip });
    next();
  } catch (error) {
    logger.warn("Invalid origin URL", { origin, ip: req.ip });
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Invalid request origin",
    });
  }
};
