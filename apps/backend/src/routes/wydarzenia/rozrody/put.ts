import { db } from "@/backend/db";
import {
  konie,
  rozrody,
  rozrodySelectSchema,
  rozrodyUpdateSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const successful_response = z.object({
  updatedEvent: rozrodySelectSchema,
});

export const wydarzenia_rozrody_put = new Hono<auth_vars>().put(
  "/rozrody/:id{[0-9]+}",
  zValidator("json", rozrodyUpdateSchema),
  describeRoute({
    description: "Zmień informacje wskazanego wydarzenia rozrodczego",
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
        .update(rozrody)
        .set(updatedData)
        .from(konie)
        .where(
          and(
            eq(rozrody.id, eventId),
            eq(konie.id, rozrody.kon),
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
        "Rozrody Put",
        "error",
        "Błąd aktualizacji wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
    }
  }
);
