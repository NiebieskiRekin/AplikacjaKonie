import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/env";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  schemaFilter: ["public", "hodowlakoni1"],
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
