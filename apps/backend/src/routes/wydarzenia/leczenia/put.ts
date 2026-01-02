import { db } from "@/backend/db";
import {
  konie,
  leczenia,
  leczeniaSelectSchema,
  leczeniaUpdateSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const successful_response = z.object({ updatedEvent: leczeniaSelectSchema });

export const wydarzenia_leczenia_put = new Hono<auth_vars>().put(
  "/leczenia/:id{[0-9]+}",
  zValidator("json", leczeniaUpdateSchema),
  describeRoute({
    description: "Zmień informacje o wskazanym podkuciu",
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
    const updatedData = c.req.valid("json");

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

      // eslint-disable-next-line drizzle/enforce-update-with-where
      const updateQuery = await db
        .update(leczenia)
        .set(updatedData)
        .from(konie)
        .where(
          and(
            eq(leczenia.id, eventId),
            eq(konie.id, leczenia.kon),
            eq(konie.hodowla, orgId)
          )
        )
        .returning();
      if (updateQuery.length === 0) {
        return c.json(
          { error: "Nie znaleziono wydarzenia do aktualizacji" },
          404
        );
      }

      return c.json({ updatedEvent: updateQuery[0] }, 200);
    } catch (error) {
      log(
        "Leczenia Put",
        "error",
        "Błąd aktualizacji wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
    }
  }
);
