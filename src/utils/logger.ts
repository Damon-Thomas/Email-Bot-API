interface LogEntry {
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private log(level: LogEntry["level"], message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    };

    // In production, you might want to send logs to a service like Winston, Pino, or a cloud logging service
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
        entry.data || ""
      );
    } else {
      // For production, you might want structured JSON logging
      console.log(JSON.stringify(entry));
    }
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }
}

export const logger = new Logger();
