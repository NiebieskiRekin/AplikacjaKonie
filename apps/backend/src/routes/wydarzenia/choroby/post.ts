import { db } from "@/backend/db";
import {
  choroby,
  chorobyInsertSchema,
  chorobySelectSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { UserPayload } from "@/backend/middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";

export const wydarzenia_choroby_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/choroby",
  zValidator("json", chorobyInsertSchema),
  describeRoute({
    description: "Dodaj nową chorobę konia",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(chorobySelectSchema) },
        },
      },
      400: {
        description: "Bład zapytania",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
        },
      },
      404: {
        description: "Bład zapytania",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
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
      const _choroby = c.req.valid("json");
      _choroby.kon = Number(_choroby.kon);

      const result = await db
        .insert(choroby)
        .values(_choroby)
        .returning()
        .then((res) => res[0]);

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd serwera" }, 500);
    }
  }
);
