import { db } from "@/backend/db";
import {
  zdarzeniaProfilaktyczne,
  zdarzeniaProfilaktyczneSelectSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { UserPayload } from "@/backend/middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const successful_response = z.object({
  deletedEvent: zdarzeniaProfilaktyczneSelectSchema,
});

export const wydarzenia_zdarzenia_profilaktyczne_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete(
  "/zdarzenia_profilaktyczne/:id{[0-9]+}",
  describeRoute({
    description: "Usuń wskazane zdarzenie profilaktyczne",
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
      const deleteQuery = await db
        .delete(zdarzeniaProfilaktyczne)
        .where(eq(zdarzeniaProfilaktyczne.id, eventId))
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      log(
        "Zdarzenia Profilaktyczne Delete",
        "error",
        "Błąd usuwania wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  }
);
