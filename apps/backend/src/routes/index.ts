import { Hono } from "hono";
import konieRoute from "./konie";
import wydarzeniaRoute from "./wydarzenia";
import kowaleRoute from "./kowale";
import weterynarzeRoute from "./weterynarze";
import admin from "../admin";
import settingsRoute from "./settings";
import images from "./images";
import { healthcheck } from "./healthcheck";
import raport from "./raport";
import chatRoute from "./chat";
import { logger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";
import { log } from "../logs/logger";
import stripAnsi from "strip-ansi";
import { auth } from "../auth";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";

const winstonHonoLogger = (message: string, ...rest: string[]) => {
  const plainMessage = stripAnsi(message);
  log("request", "info", plainMessage + " " + rest.join(" "));
};

export function registerRoutes(app: Hono) {
  return app
    .basePath("/api")
    .use("*", logger(winstonHonoLogger))
    .on(["POST", "GET"], "/auth/*", (c) => {
      return auth.handler(c.req.raw);
    })
    .use(
      cors({
        origin: "http://localhost:5173",
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
      })
    )
    .get(
      "/openapi",
      openAPIRouteHandler(app, {
        documentation: {
          info: {
            title: "Konie API",
            version: "0.1.0",
            description: "API do aplikacji koni i weterynarzy",
          },
          servers: [
            { url: "http://localhost:3000", description: "Local Server" },
            { url: "http://localhost:5173", description: "Frontend Server" },
            {
              url: "https://konie-dev.at2k.pl",
              description: "Development server",
            },
          ],
        },
      })
    )
    .use(
      "/ui",
      Scalar({
        pageTitle: "API Documentation",
        sources: [
          { url: "/api/openapi", title: "API" },
          { url: "/api/auth/open-api/generate-schema", title: "Auth" },
        ],
      })
    )
    .route("/healthcheck", healthcheck)
    .route("/konie", konieRoute)
    .route("/wydarzenia", wydarzeniaRoute)
    .route("/kowale", kowaleRoute)
    .route("/weterynarze", weterynarzeRoute)
    .route("/ustawienia", settingsRoute)
    .route("/images", images)
    .route("/raport", raport)
    .route("/chat", chatRoute)
    .route("/admin", admin);
}
export const apiRoutes = registerRoutes(new Hono());

export type ApiRoutes = typeof apiRoutes;
