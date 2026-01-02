import { db } from "@/backend/db";
import {
  konie,
  leczenia,
  leczeniaInsertSchema,
  leczeniaSelectSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { and, eq } from "drizzle-orm";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_leczenia_post = new Hono<auth_vars>().post(
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const _leczenia = c.req.valid("json");
      _leczenia.kon = Number(_leczenia.kon);

      const kon = await db
        .select({ id: konie.id })
        .from(konie)
        .where(and(eq(konie.hodowla, orgId), eq(konie.id, _leczenia.kon)));

      if (kon.length === 0) {
        c.json({ error: "Nie znaleziono konia" }, 400);
      }

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
