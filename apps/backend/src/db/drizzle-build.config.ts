import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/db/migrations/",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  breakpoints: true,
  verbose: true,
  strict: true,
});
