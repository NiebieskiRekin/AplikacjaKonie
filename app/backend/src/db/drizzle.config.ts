import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "../env";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  schemaFilter: ["hodowlakoni"],
  dbCredentials: {
    url: DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
