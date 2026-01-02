import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";
import { log } from "../logs/logger";

export async function migrate_db() {
  log("Migrate", "info", "Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations/" });
  } catch (err) {
    log("Migrate", "error", "Migration failed");
    log("Migrate", "error", String(err));
    process.exit(1);
  }

  log("Migrate", "info", "Migrations completed successfully");
}
