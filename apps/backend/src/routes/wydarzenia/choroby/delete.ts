import { db } from "@/backend/db";
import { choroby, chorobySelectSchema, konie } from "@/backend/db/schema";
import { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const successful_response = z.object({ deletedEvent: chorobySelectSchema });

export const wydarzenia_choroby_delete = new Hono<auth_vars>().delete(
  "/choroby/:id{[0-9]+}",
  describeRoute({
    description: "Usuń wskazaną chorobę konia",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(successful_response) },
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
      const eventId = Number(c.req.param("id"));

      if (isNaN(eventId)) {
        return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
      }

      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const horsesSubquery = db
        .select({ id: konie.id })
        .from(konie)
        .where(eq(konie.hodowla, orgId));

      const deleteQuery = await db
        .delete(choroby)
        .where(
          and(eq(choroby.id, eventId), inArray(choroby.kon, horsesSubquery))
        )
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      log(
        "Choroby Delete",
        "error",
        "Błąd usuwania wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  }
);
