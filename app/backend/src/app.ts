import { db } from "./db";
import { konie } from "./db/schema";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { hodowcyKoniRoute } from "./routes/hodowcykoni";
import { cors } from "hono/cors";
import { ProcessEnv } from "./env";
import login from "./Security/login"
const app = new Hono();

app.use("/api/*", cors());
if (ProcessEnv.NODE_ENV != "production"){
    app.use("*", logger()); // Only for testing and development
}


const apiRoutes = app.basePath("/api").route("/hodowcykoni", hodowcyKoniRoute).route("/login", login);


export default app;
export type ApiRoutes = typeof apiRoutes;
