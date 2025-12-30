import { db } from "@/backend/db";
import {
  choroby,
  chorobyInsertSchema,
  chorobySelectSchema,
  konie,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { and, eq } from "drizzle-orm";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_choroby_post = new Hono<auth_vars>().post(
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const _choroby = c.req.valid("json");
      _choroby.kon = Number(_choroby.kon);

      const kon = await db
        .select({ id: konie.id })
        .from(konie)
        .where(and(eq(konie.hodowla, orgId), eq(konie.id, _choroby.kon)));

      if (kon.length === 0) {
        c.json({ error: "Nie znaleziono konia" }, 400);
      }

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
