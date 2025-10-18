import winston from "winston";
import { __prod__, ProcessEnv } from "../env";
import { LogEntry, LogEntrySchema } from "./schema";
import { z } from "zod";

// Format NDJSON
const ndjsonFormat = winston.format.printf((info) => {
  const logInfo = info as winston.Logform.TransformableInfo & LogEntry;

  const { level, message, category, timestamp, stack, error, ...rest } =
    logInfo;

  const logData = {
    timestamp,
    level,
    category,
    message,
    stack,
    // Dodaj pełny stos błędu z winston.format.errors, który jest często w 'rest'
    ...(error && error.stack
      ? { errorStack: error.stack, errorMessage: error.message }
      : {}),
    ...rest, // Wszystkie inne meta-dane
  };

  // Usuwamy puste pola
  Object.keys(logData).forEach(
    (key) => (logData as any)[key] === undefined && delete (logData as any)[key]
  );

  return JSON.stringify(logData);
});

// Format Tekstowy
const textFormat = winston.format.printf((info) => {
  const logInfo = info as winston.Logform.TransformableInfo & LogEntry;

  // Teraz możemy bezpiecznie używać pól z logInfo
  const { level, message, category, timestamp, stack, error } = logInfo;

  let output = `${timestamp} [${category}] ${level.toUpperCase()}: ${message}`;

  if (stack) {
    output += ` (${stack})`;
  }
  // Obsługa błędu, jeśli format.errors({ stack: true }) go dodał
  if (error && error.stack) {
    output += `\n  Error: ${error.message}`;
    // Usuń pierwszą linię 'Error: ...' ze stack trace
    output += `\n${error.stack.split("\n").slice(1).join("\n")}`;
  }

  return output;
});

// --- Konfiguracja Loggera ---
const finalFormat =
  ProcessEnv.LOG_FORMAT === "json" ? ndjsonFormat : textFormat;

const consoleTransportFormat =
  ProcessEnv.LOG_FORMAT === "text"
    ? winston.format.combine(winston.format.colorize(), finalFormat)
    : finalFormat;

const logger = winston.createLogger({
  level: ProcessEnv.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }), // Wstawia pełny stos błędu do obiektu 'info'
    winston.format.splat(),
    // Nie potrzebujemy customFormat do dodawania pól, bo robimy to w funkcji log
    finalFormat
  ),
  transports: [
    new winston.transports.Console({
      format: consoleTransportFormat,
    }),
  ],
});

// --- Silnie Typowana Funkcja log ---

/**
 * @param category - Kategoria loga (np. `db`, `server`, `mail`)
 * @param level - Poziom loga (`info`, `warn`, `error`, `debug`)
 * @param message - Treść wiadomości
 * @param error - Opcjonalnie: obiekt błędu
 */
export function log(
  category: LogEntry["category"],
  level: LogEntry["level"],
  message: LogEntry["message"],
  error?: LogEntry["error"]
) {
  // Przechwytywanie ścieżki pliku i linii wywołania.
  const stackTrace = new Error().stack?.split("\n")[3]?.trim();

  // Obiekt logu jest teraz silnie typowany przez LogEntry
  const logData: LogEntry = {
    level,
    message,
    category,
    stack: stackTrace, // Opcjonalny
    error: error ?? undefined, // Używamy undefined zamiast null, aby zgadzał się z Zod.optional()
  };

  // Używamy Zod do walidacji obiektu logu przed wysłaniem
  try {
    LogEntrySchema.parse(logData);
  } catch (validationError) {
    // W przypadku błędu walidacji (co nie powinno się zdarzyć, jeśli typy są poprawne)
    logger.error({
      level: "error", // Wymagane przez winston
      message: "Log validation error",
      category: "logger",
      validationDetails: (validationError as z.ZodError).errors,
      originalLog: logData,
    });
    // Możesz zdecydować, czy chcesz kontynuować logowanie pierwotnego logu, czy go porzucić
    // W tym przykładzie, po prostu kontynuujemy.
  }

  // Przekazujemy silnie typowany obiekt
  logger.log(logData);
}

export default logger;
