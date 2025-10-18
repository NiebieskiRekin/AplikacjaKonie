import { Hono } from "hono";
import { __prod__, ProcessEnv } from "./env";
import { registerRoutes } from "./routes";
import { log } from "./logs/logger";
import "./crons/index";
const app = registerRoutes(new Hono());

log("Server", "info", "Mode: " + ProcessEnv.NODE_ENV);

export default app;
