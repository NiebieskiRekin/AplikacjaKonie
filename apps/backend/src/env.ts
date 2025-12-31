import { z } from "zod";
import dotenv from "dotenv";
import { LogFormat, LogLevel } from "./logs/schema";
dotenv.config({
  path: __dirname + "/../../../.env",
  quiet: true,
  override: true,
});

const splitAndTrim = (val: string) =>
  val
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const ServeEnv = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("3001")
    .transform(Number),

  DATABASE_URL: z
    .url("Must be a valid URL string")
    .default("postgres://postgres:mysecretpassword@localhost:5432/postgres"),

  NODE_ENV: z
    .enum(["local", "development", "test", "production"])
    .default("local"),

  DOMAIN: z.string().default("localhost"),
  INITIAL_ADMIN_PASSWORD: z.string().default("admin"),
  BETTER_AUTH_SECRET: z.string(),
  GOOGLE_API_KEY_BASE64: z.base64(),

  EMAIL_USER: z.email(),
  EMAIL_PASS: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("587")
    .transform(Number),
  EMAIL_SERVICE_TYPE: z.string().default("gmail"),

  LOG_FORMAT: LogFormat,
  LOG_LEVEL: LogLevel,

  BUCKET_NAME: z.string(),
  AISTUDIO_API_KEY: z.string(),
  TRUSTED_ORIGINS: z.string().transform(splitAndTrim).pipe(z.array(z.url())),
  INTERNAL_PREDICT_URL: z.string(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  DATABASE_SCHEMA: z.string().default("public"),
});

export const ProcessEnv = ServeEnv.parse(process.env);
export const __prod__ = ProcessEnv.NODE_ENV === "production";
