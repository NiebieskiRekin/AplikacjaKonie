import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "../env";

export default defineConfig({
  out: "./migrations",
  schema: "./schema.ts",
  dialect: "postgresql",
  schemaFilter: ["public", "hodowlakoni1"],
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
