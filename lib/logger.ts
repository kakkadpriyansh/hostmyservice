import { env } from "@/lib/env";

type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    if (process.env.NODE_ENV === "development") {
        // Pretty print in dev
        const color = {
            info: "\x1b[32m", // Green
            warn: "\x1b[33m", // Yellow
            error: "\x1b[31m", // Red
            debug: "\x1b[36m", // Cyan
        }[level];
        const reset = "\x1b[0m";
        
        console.log(`${color}[${level.toUpperCase()}]${reset} ${message}`, meta ? meta : "");
    } else {
        // JSON structured logging for production (better for observability tools)
        console.log(JSON.stringify(logData));
    }
  }

  info(message: string, meta?: any) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: any) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: any) {
    this.log("error", message, meta);
  }

  debug(message: string, meta?: any) {
    this.log("debug", message, meta);
  }
}

export const logger = new Logger();
