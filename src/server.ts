import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { RateLimiterMemory } from "rate-limiter-flexible";
import mailRouter from "./routes/mail.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_POINTS || "5"), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_DURATION || "60"), // Per seconds
});

// Enhanced CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) =>
  origin.trim()
) || [
  "http://localhost:3000",
  "http://localhost:5173", // Vite default
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn("CORS blocked request from origin", { origin });
      callback(new Error("Not allowed by CORS policy"), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy (important for rate limiting with reverse proxies)
app.set("trust proxy", 1);

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    await rateLimiter.consume(ip);
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.round((rejRes?.msBeforeNext || 60000) / 1000),
    });
  }
});

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/mail", mailRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Not Found", message: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Mailer API server running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
