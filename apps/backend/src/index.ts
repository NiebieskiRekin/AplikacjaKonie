import app from "./app";
import { ProcessEnv } from "./env";
import { serve } from "@hono/node-server";

export const server = serve(
  {
    port: ProcessEnv.PORT,
    hostname: "0.0.0.0",
    fetch: app.fetch,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);