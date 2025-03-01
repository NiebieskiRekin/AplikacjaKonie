import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { ProcessEnv } from "./env";
import login from "./routes/login"
import register from "./routes/register";
import konieRoute from "./routes/konie";
import restartRoutes from "./routes/restart";
import wydarzeniaRoute from "./routes/wydarzenia";
import { hodowcyKoniRoute } from "./routes/hodowcykoni";
import refresh from "./routes/refresh";
const app = new Hono();

app.use("/api/*", cors());
if (ProcessEnv.NODE_ENV != "production") {
  app.use("*", logger()); // Only for testing and development
}


const apiRoutes = app.basePath("/api")
    .route("/refresh",refresh)
    .route("/login", login)
    .route("/register", register)
    .route("/konie", konieRoute)
    .route("/restart", restartRoutes)
    .route("/wydarzenia", wydarzeniaRoute)
    .route("/hodowcykoni", hodowcyKoniRoute)


export default app;
export type ApiRoutes = typeof apiRoutes;
