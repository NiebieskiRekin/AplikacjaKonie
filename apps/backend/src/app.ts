import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { __prod__, ProcessEnv } from "./env";
import { registerRoutes } from "./routes";
import { log } from "./logs/logger";
import "./crons/index";
import { openAPISpecs } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const app = registerRoutes(new Hono());

const winstonHonoLogger = (message: string) => {
  // Hono logger domyślnie dodaje timestamp i poziom w tekście, np.:
  // "[Hono] 127.0.0.1 - GET /api/users - 200 - 15ms"

  // Zazwyczaj logi żądań traktuje się jako 'info' lub 'debug'
  // W Hono wiadomość jest pojedynczym stringiem, więc użyjemy go jako 'message'.
  log("request", "info", message);
};

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Konie API",
        version: "0.1.0",
        description: "API do aplikacji koni i weterynarzy",
      },
      servers: [
        { url: "http://localhost:3000", description: "Local Server" },
        { url: "https://konie-dev.at2k.pl", description: "Development server" },
      ],
    },
  })
);

app.use("/ui", swaggerUI({ url: "/api/openapi" }));

app.use("*", cors());

app.use("*", logger(winstonHonoLogger));

log("Server", "info", "Mode: " + ProcessEnv.NODE_ENV);

export default app;
