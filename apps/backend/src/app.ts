import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { ProcessEnv } from "./env";
import { registerRoutes } from "./routes";

const app = registerRoutes(new Hono());

app.use("/api/*", cors());
if (ProcessEnv.NODE_ENV != "production") {
  app.use("*", logger()); // Only for testing and development
}

export default app;
