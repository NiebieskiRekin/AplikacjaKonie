import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";
import { log } from "../logs/logger";
import path from "node:path";

export async function migrate_db() {
  log("Migrate", "info", "Running migrations...");

  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, "migrations") });
  } catch (err) {
    log("Migrate", "error", "Migration failed");
    log("Migrate", "error", String(err));
    process.exit(1);
  }

  log("Migrate", "info", "Migrations completed successfully");
}
