import { db } from "@/backend/db";
import {
  podkucia,
  podkuciaSelectSchema,
  podkuciaUpdateSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const successful_response = z.object({
  updatedEvent: podkuciaSelectSchema,
});

export const wydarzenia_podkucie_put = new Hono<auth_vars>().put(
  "/podkucie/:id{[0-9]+}",
  zValidator("json", podkuciaUpdateSchema),
  describeRoute({
    description: "Zmień informacje wskazanego podkucia",
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
      const updateQuery = await db
        .update(podkucia)
        .set(updatedData)
        .where(eq(podkucia.id, eventId))
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
        "Podkucie Put",
        "error",
        "Błąd aktualizacji wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
    }
  }
);
