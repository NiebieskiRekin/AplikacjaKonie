import { Hono } from "hono";
import { logger } from "hono/logger";
import { hodowcyKoniRoute } from "./routes/hodowcykoni";
import { cors } from "hono/cors";
import { ProcessEnv } from "./env";
import login from "./routes/login"
import register from "./routes/register";
import konieRoute from "./routes/konie";
import restartRoutes from "./routes/restart";
import wydarzeniaRoute from "./routes/wydarzenia";
import kowaleRoute from "./routes/kowale";
import weterynarzeRoute from "./routes/weterynarze";

const app = new Hono();

app.use("/api/*", cors());
if (ProcessEnv.NODE_ENV != "production") {
  app.use("*", logger()); // Only for testing and development
}


const apiRoutes = app.basePath("/api")
    .route("/hodowcykoni", hodowcyKoniRoute)
    .route("/login", login)
    .route("/register", register)
    .route("/konie", konieRoute)
    .route("/restart", restartRoutes)
    .route("/wydarzenia", wydarzeniaRoute)
    .route("/kowale", kowaleRoute)
    .route("/weterynarze", weterynarzeRoute)

export default app;
export type ApiRoutes = typeof apiRoutes;
