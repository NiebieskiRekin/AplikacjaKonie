import app from "./app";
import { ProcessEnv } from "./env";
import { serve } from "@hono/node-server";
import { log } from "./logs/logger";
import { migrate_db } from "./db/migrate";
import { seed_db } from "./db/seed";

async function startServer() {
  await migrate_db();
  await seed_db();

  serve(
    {
      port: ProcessEnv.PORT,
      hostname: "0.0.0.0",
      fetch: app.fetch,
    },
    (info) => {
      log(
        "Server",
        "info",
        `Server is running on http://${info.address}:${info.port}`
      );
    }
  );
}

startServer().catch((err) => {
  log("Server", "error", `Failed to start server: ${err}`);
  process.exit(1);
});
