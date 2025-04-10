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

export function registerRoutes(app: Hono) {
  return app
    .basePath("/api")
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
    .route("/healthcheck", healthcheck);
}
export const apiRoutes = registerRoutes(new Hono());

export type ApiRoutes = typeof apiRoutes;
