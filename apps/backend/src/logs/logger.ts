import winston from "winston";
import { ProcessEnv } from "../env";
import { LogEntry, LogEntrySchema } from "./schema";
import { z } from "zod";

const ndjsonFormat = winston.format.printf((info) => {
  const logInfo = info as winston.Logform.TransformableInfo & LogEntry;

  // Przechwytywanie ścieżki pliku i linii wywołania.
  const stackTrace = new Error().stack?.split("\n")[3]?.trim();

  const { level, message, category, timestamp, error, ...rest } = logInfo;

  const logData = {
    timestamp,
    level,
    category,
    message,
    stackTrace,
    ...(error && error.stack
      ? { errorStack: error.stack, errorMessage: error.message }
      : {}),
    ...rest,
  };

  // Usuwamy puste pola
  Object.keys(logData).forEach(
    (key) => (logData as any)[key] === undefined && delete (logData as any)[key] // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  );

  return JSON.stringify(logData);
});

const textFormat = winston.format.printf((info) => {
  const logInfo = info as winston.Logform.TransformableInfo & LogEntry;

  const { level, message, category, timestamp, error } = logInfo;

  let output = `${timestamp as string} [${category}] ${level.toUpperCase()}: ${message}`;

  // Obsługa błędu, jeśli format.errors({ stack: true }) go dodał
  if (error && error.stack) {
    output += `\n  Error: ${error.message}`;
    // Usuń pierwszą linię 'Error: ...' ze stack trace
    output += `\n${error.stack.split("\n").slice(1).join("\n")}`;
  }

  return output;
});

const finalFormat =
  ProcessEnv.LOG_FORMAT === "json" ? ndjsonFormat : textFormat;

const logger = winston.createLogger({
  level: ProcessEnv.LOG_LEVEL,
  format: winston.format.combine(
    // winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.splat(),
    finalFormat
  ),
  transports: [new winston.transports.Console()],
});

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
  const logData: LogEntry = {
    level,
    message,
    category,
    error: error ?? undefined,
  };

  try {
    LogEntrySchema.parse(logData);
  } catch (validationError) {
    logger.error({
      level: "error",
      message: "Log validation error",
      category: "logger",
      validationDetails: validationError as z.ZodError,
      originalLog: logData,
    });
  }

  logger.log(logData);
}

export default logger;
