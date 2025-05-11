import { Hono } from "hono";
import { db } from "../db";
import { sql } from "drizzle-orm";

import { describeRoute } from "hono-openapi";
import { JsonMime } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { z } from "zod";

const schema = z.object({ status: z.string() });

export const healthcheck = new Hono().get(
  "/",
  describeRoute({
    description: "Sprawdź stan usługi API",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(schema) },
        },
      },
      500: {
        description: "Bład serwera",
        content: {
          [JsonMime]: { schema: resolver(schema) },
        },
      },
    },
  }),
  async (c) => {
    try {
      await db.execute(sql`select CURRENT_TIME`);
      return c.json({ status: "ok" }, 200);
    } catch {
      return c.json({ status: "error" }, 500);
    }
  }
);
