import app from "./app";
import { ProcessEnv } from "./env";
import { serve } from "@hono/node-server";
import { log } from "./logs/logger";

export const server = serve(
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
