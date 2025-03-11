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
import images from "./images";

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
    .route("/images", images);
}
export const apiRoutes = registerRoutes(new Hono());

export type ApiRoutes = typeof apiRoutes;
