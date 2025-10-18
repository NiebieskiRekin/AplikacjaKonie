import { z } from "zod";

export const LogFormat = z.enum(["json", "text"]).default("text");

export const LogLevel = z
  .union([
    z.literal("info"),
    z.literal("warn"),
    z.literal("error"),
    z.literal("debug"),
  ])
  .default("info");

// Schemat dla METADANYCH logu
const LogMetaSchema = z.object({
  category: z.string().describe("Kategoria logu (np. db, server, mail)"),
  stack: z.string().optional().describe("Plik i linia kodu wywołującego log"),
});

// Schemat dla pełnego obiektu, który jest przekazywany do logger.log()
export const LogEntrySchema = LogMetaSchema.extend({
  level: LogLevel,
  message: z.string(),
  // Error nie jest walidowany jako pełny Error object,
  // ponieważ winston i logform często manipulują tym polem
  // ale sprawdzamy, czy jest to opcjonalne.
  error: z.instanceof(Error).optional().nullable(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;
