import { db } from "@/backend/db";
import {
  rozrody,
  rozrodyInsertSchema,
  rozrodySelectSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_rozrody_post = new Hono<auth_vars>().post(
  "/rozrody",
  zValidator("json", rozrodyInsertSchema),
  describeRoute({
    description: "Dodaj wydarzenie rozrodcze",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(rozrodySelectSchema) },
        },
      },
      500: {
        description: "Bład serwera",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
        },
      },
    },
  }),
  async (c) => {
    try {
      const _rozrody = c.req.valid("json");
      _rozrody.kon = Number(_rozrody.kon);
      _rozrody.weterynarz = Number(_rozrody.weterynarz);

      const result = await db
        .insert(rozrody)
        .values(_rozrody)
        .returning()
        .then((res) => res[0]);

      return c.json(result, 200);
    } catch {
      return c.json({ error: "Błąd serwera" }, 500);
    }
  }
);
