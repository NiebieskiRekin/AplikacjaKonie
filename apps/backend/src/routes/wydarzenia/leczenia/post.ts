import { db } from "@/backend/db";
import {
  leczenia,
  leczeniaInsertSchema,
  leczeniaSelectSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { UserPayload } from "@/backend/middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";

export const wydarzenia_leczenia_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/leczenia",
  zValidator("json", leczeniaInsertSchema),
  describeRoute({
    description: "Dodaj nowe podkucie",
    responses: {
      201: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(leczeniaSelectSchema) },
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
      const _leczenia = c.req.valid("json");
      _leczenia.kon = Number(_leczenia.kon);

      const result = await db
        .insert(leczenia)
        .values(_leczenia)
        .returning()
        .then((res) => res[0]);

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd serwera" }, 500);
    }
  }
);
