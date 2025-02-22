import { db } from "./db";
import { konie } from "./db/schema";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { hodowcyKoniRoute } from "./routes/hodowcykoni";
import { cors } from "hono/cors";

const app = new Hono();

app.use("/api/*", cors());
app.use("*", logger()); // Only for testing and development

const apiRoutes = app.basePath("/api").route("/hodowcykoni", hodowcyKoniRoute);
//   .route("/", authRoute);

export default app;
export type ApiRoutes = typeof apiRoutes;
