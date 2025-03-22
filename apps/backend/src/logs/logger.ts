import winston from "winston";
import path from "path";
import fs from "fs";

/**
 * https://github.com/winstonjs/winston
 * https://github.com/winstonjs/logform
 * 
 * zapisywać log jako json
 * nadać timestamp
 * zawęzić logi względem kategorii (db, client request, mail, ...)
 * zawęzić logi do określonej kategorii (info, warn, error)
 * każdy log powinien precyzyjnie wskazywać linię kodu, a ich ciąg przebieg procedury
 */
const logFormat = winston.format.printf(({ level, message, category, timestamp, stack }) => {
  return JSON.stringify({
    timestamp,
    category,
    level,
    message,
    stack,
  });
});

const logDir = path.join(process.cwd(), "apps/backend/logs");

// Sprawdzam czy katalog na logi istnieje
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    // Zapis do plików logów
    new winston.transports.File({ filename: `logs/error.log`, level: "error" }),
    new winston.transports.File({ filename: `logs/combined.log` }),

    // Zapis do konsoli
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

/**
 * @param category - Kategoria loga (np. `db`, `server`, `mail`)
 * @param level - Poziom loga (`info`, `warn`, `error`)
 * @param message - Treść wiadomości
 * @param error - Opcjonalnie: obiekt błędu
 */
export function log(category: string, level: "info" | "warn" | "error", message: string, error?: Error) {
  const stackTrace = new Error().stack?.split("\n")[2].trim(); // Pobiera plik i linię kodu
  logger.log({ level, category, message, stack: stackTrace, error });
}

// dodatkowo na konsole dla Nas
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console());
}

export default logger;
