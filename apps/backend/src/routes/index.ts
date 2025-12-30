import { Hono } from "hono";
import login from "./login";
import register from "./register";
import konieRoute from "./konie";
import restartRoutes from "./restart";
import wydarzeniaRoute from "./wydarzenia";
import { hodowcyKoniRoute } from "./hodowcykoni";
import refresh from "./refresh";
import kowaleRoute from "./kowale";
import weterynarzeRoute from "./weterynarze";
import settingsRoute from "./settings";
import images from "./images";
import { healthcheck } from "./healthcheck";
import raport from "./raport";
import chatRoute from "./chat";
import { logger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { log } from "../logs/logger";
import stripAnsi from "strip-ansi";
import { auth } from "../auth";
// import { auth_middleware } from "../middleware/auth-middleware";

const winstonHonoLogger = (message: string, ...rest: string[]) => {
  const plainMessage = stripAnsi(message);
  log("request", "info", plainMessage + " " + rest.join(" "));
};

export function registerRoutes(app: Hono) {
  return app
    .basePath("/api")
    .use("*", logger(winstonHonoLogger))
    .on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw))
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
            {
              url: "https://konie-dev.at2k.pl",
              description: "Development server",
            },
          ],
        },
      })
    )
    .use("/ui", swaggerUI({ url: "/api/openapi" }))
    .route("/refresh", refresh)
    .route("/login", login)
    .route("/register", register)
    .route("/konie", konieRoute)
    .route("/restart", restartRoutes)
    .route("/wydarzenia", wydarzeniaRoute)
    .route("/hodowcykoni", hodowcyKoniRoute)
    .route("/kowale", kowaleRoute)
    .route("/weterynarze", weterynarzeRoute)
    .route("/ustawienia", settingsRoute)
    .route("/images", images)
    .route("/healthcheck", healthcheck)
    .route("/raport", raport)
    .route("/chat", chatRoute);
}
export const apiRoutes = registerRoutes(new Hono());

export type ApiRoutes = typeof apiRoutes;
