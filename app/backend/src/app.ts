import { db } from "./db";
import { konie } from "./db/schema";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", logger()); // Only for testing and development

// app.get("/", (c) => {
//   db.select()
//     .from(konie)
//     .then((value) => {
//       const r = JSON.stringify(value);
//       return c.text("Express + TypeScript Server " + r);
//     })
//     .catch((error) => {
//       return c.text("db error" + error);
//     });
//   return c.text("Hello Hono!");
// });

const apiRoutes = app
  .basePath("/api")
//   .route("/expenses", expensesRoute)
//   .route("/", authRoute);

export default app;
export type ApiRoutes = typeof apiRoutes;
