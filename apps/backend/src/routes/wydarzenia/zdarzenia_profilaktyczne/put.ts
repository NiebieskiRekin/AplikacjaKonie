import { db } from "@/backend/db";
import {
  zdarzeniaProfilaktyczne,
  zdarzeniaProfilaktyczneSelectSchema,
  zdarzeniaProfilaktyczneUpdateSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { UserPayload } from "@/backend/middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const successful_response = z.object({
  updatedEvent: zdarzeniaProfilaktyczneSelectSchema,
});

export const wydarzenia_zdarzenia_profilaktyczne_put = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().put(
  "/zdarzenia_profilaktyczne/:id{[0-9]+}",
  describeRoute({
    description: "Zmień informacje wskazanego zdarzenia profilaktycznego",
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
  zValidator("json", zdarzeniaProfilaktyczneUpdateSchema),
  async (c) => {
    const eventId = Number(c.req.param("id"));
    const updatedData = c.req.valid("json");

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      const updateQuery = await db
        .update(zdarzeniaProfilaktyczne)
        .set(updatedData)
        .where(eq(zdarzeniaProfilaktyczne.id, eventId))
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
        "Zdarzenia Profilaktyczne Put",
        "error",
        "Błąd aktualizacji wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
    }
  }
);
