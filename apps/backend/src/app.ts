import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { ProcessEnv } from "./env";
import { registerRoutes } from "./routes";
import { log } from "./logs/logger";
import "./crons/index";
import { openAPISpecs } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const app = registerRoutes(new Hono());

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Hono API",
        version: "0.1.0",
        description: "API do aplikacji koni i weterynarzy",
      },
      servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  })
);

app.use("/ui", swaggerUI({ url: "/api/openapi" }));

app.use("*", cors());
if (ProcessEnv.NODE_ENV != "production") {
  app.use("*", logger()); // Only for testing and development
  log("Server", "info", "Połączono z Serwerem");
}

export default app;
