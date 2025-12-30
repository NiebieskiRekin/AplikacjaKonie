import { defineConfig } from "drizzle-kit";
import { ProcessEnv } from "../env";

export default defineConfig({
  out: "./src/db/migrations/" + ProcessEnv.NODE_ENV,
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  schemaFilter: [ProcessEnv.DATABASE_SCHEMA],
  dbCredentials: {
    url: ProcessEnv.DATABASE_URL,
  },
  breakpoints: true,
  verbose: true,
  strict: true,
});
