import { z } from "zod";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../../.env" });

const ServeEnv = z.object({
  PORT: z
    .string()
    .regex(/^\d+$/, "Port must be a numeric string")
    .default("3001")
    .transform(Number),

  DATABASE_URL: z
    .string()
    .url("Must be a valid URL string")
    .default("postgres://postgres:mysecretpassword@localhost:5432/postgres"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DOMAIN: z.string().default("localhost"),

  // Dla algorytmów HS można ustawić private_key=public_key. Instrukcja generowania kluczy RS256 znajduje się w infra/jwt-key-setup.md

  JWT_REFRESH_PRIVATE_KEY: z.string({
    message:
      "Brak ustawionego JWT_REFRESH_PRIVATE_KEY w zmiennych środowiskowych.",
  }),

  JWT_REFRESH_PUBLIC_KEY: z.string({
    message:
      "Brak ustawionego JWT_REFRESH_PUBLIC_KEY w zmiennych środowiskowych.",
  }),

  JWT_ACCESS_PRIVATE_KEY: z.string({
    message:
      "Brak ustawionego JWT_ACCESS_PRIVATE_KEY w zmiennych środowiskowych.",
  }),

  JWT_ACCESS_PUBLIC_KEY: z.string({
    message:
      "Brak ustawionego JWT_ACCESS_PUBLIC_KEY w zmiennych środowiskowych.",
  }),

  JWT_ALG: z
    .enum([
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512",
      "EdDSA",
    ])
    .default("HS256"),

  ADMIN_PASSWORD_BCRYPT: z.string(),

  GOOGLE_API_KEY_BASE64: z.string().base64(),

  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string(),
  LOG_FORMAT: z.enum(["json", "text"]).default("text"),
});

export const ProcessEnv = ServeEnv.parse(process.env);
export const __prod__ = ProcessEnv.NODE_ENV === "production";
