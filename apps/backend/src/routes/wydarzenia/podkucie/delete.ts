import { db } from "@/backend/db";
import { konie, podkucia, podkuciaSelectSchema } from "@/backend/db/schema";
import { Hono } from "hono";
import { eq, inArray, and } from "drizzle-orm";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const successful_response = z.object({
  deletedEvent: podkuciaSelectSchema,
});

export const wydarzenia_podkucie_delete = new Hono<auth_vars>().delete(
  "/podkucie/:id{[0-9]+}",
  describeRoute({
    description: "Usuń wskazane podkucie",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(successful_response) },
        },
      },
      400: {
        description: "Błąd zapytania",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
        },
      },
      404: {
        description: "Błąd zapytania",
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
    const eventId = Number(c.req.param("id"));

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
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
        .delete(podkucia)
        .where(
          and(eq(podkucia.id, eventId), inArray(podkucia.kon, horsesSubquery))
        )
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      log(
        "Podkucie Delete",
        "error",
        "Błąd usuwania wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  }
);
