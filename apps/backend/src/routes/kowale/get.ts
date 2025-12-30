import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq, and } from "drizzle-orm";
import { kowale, kowaleSelectSchema, users } from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

export const kowale_get = new Hono<auth_vars>().get(
  "/",
  describeRoute({
    description: "Wyświetl kowali z hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(z.array(kowaleSelectSchema)) },
        },
      },
      401: {
        description: "Bład autoryzacji",
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
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const allKowale = await db
        .select()
        .from(kowale)
        .where(
          and(
            eq(
              kowale.hodowla,
              db
                .select({ h: users.hodowla })
                .from(users)
                .where(eq(users.id, user))
            ),
            eq(kowale.active, true)
          )
        );
      return c.json(allKowale, 200);
    } catch {
      return c.json({ error: "Błąd pobierania kowali" }, 500);
    }
  }
);
