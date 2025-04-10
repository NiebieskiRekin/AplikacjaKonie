import { Hono } from "hono";
import { db } from "../db";
import { sql } from "drizzle-orm";

export const healthcheck = new Hono().get("/", async (c) => {
  try {
    await db.execute(sql`select CURRENT_TIME`);
    return c.json({ status: "ok" }, 200);
  } catch {
    return c.json({ status: "error" }, 500);
  }
});
