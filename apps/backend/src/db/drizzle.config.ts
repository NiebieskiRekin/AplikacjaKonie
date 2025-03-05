import { defineConfig } from "drizzle-kit";
import { ProcessEnv } from "../env";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  schemaFilter: ["hodowlakoni"],
  dbCredentials: {
    url: ProcessEnv.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
