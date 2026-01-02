import { Hono } from "hono";
import { ProcessEnv } from "./env";
import { registerRoutes } from "./routes";
import { log } from "./logs/logger";
import { LinearRouter } from "hono/router/linear-router";
import "./crons/index";
const app = registerRoutes(new Hono({ router: new LinearRouter() }));

log("Server", "info", "Mode: " + ProcessEnv.NODE_ENV);

export default app;
