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

  REFRESH_JWT_SECRET: z.string({
    message: "Brak ustawionego REFRESH_JWT_SECRET w zmiennych środowiskowych.",
  }),

  JWT_SECRET: z.string({
    message: "Brak ustawionego JWT_SECRET w zmiennych środowiskowych.",
  }),

  ADMIN_PASSWORD_BCRYPT: z.string(),
});

export const ProcessEnv = ServeEnv.parse(process.env);
export const __prod__ = ProcessEnv.NODE_ENV === "production";
