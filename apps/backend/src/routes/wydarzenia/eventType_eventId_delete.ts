import { db } from "@/backend/db";
import {
  choroby,
  leczenia,
  rozrody,
  zdarzeniaProfilaktyczne,
  podkucia,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { UserPayload } from "@/backend/middleware/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { eventTypeUnionSchema } from "./schema";
import { resolver } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";

export const wydarzenia_eventType_eventId_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete(
  "/:type{[A-Za-z_-]+}/:id{[0-9]+}",
  describeRoute({
    description: "Usuń wydarzenie o wskazanym typie i identyfikatorze",
    responses: {
      200: {
        description: "Usunięto wydarzenie",
        content: {
          [JsonMime]: { schema: resolver(eventTypeUnionSchema) },
        },
      },
      400: {
        description: "Błąd zapytania",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
        },
      },
      500: {
        description: "Błąd serwera",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
        },
      },
    },
  }),
  async (c) => {
    const eventId = Number(c.req.param("id"));
    const eventType = c.req.param("type").toLowerCase();

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      let deleted;

      switch (eventType) {
        case "choroby":
          deleted = await db
            .delete(choroby)
            .where(eq(choroby.id, eventId))
            .returning();
          break;
        case "leczenia":
          deleted = await db
            .delete(leczenia)
            .where(eq(leczenia.id, eventId))
            .returning();
          break;
        case "rozrody":
          deleted = await db
            .delete(rozrody)
            .where(eq(rozrody.id, eventId))
            .returning();
          break;
        case "zdarzenia_profilaktyczne":
          deleted = await db
            .delete(zdarzeniaProfilaktyczne)
            .where(eq(zdarzeniaProfilaktyczne.id, eventId))
            .returning();
          break;
        case "podkucie":
          deleted = await db
            .delete(podkucia)
            .where(eq(podkucia.id, eventId))
            .returning();
          break;
        case "podkucia":
          deleted = await db
            .delete(podkucia)
            .where(eq(podkucia.id, eventId))
            .returning();
          break;
        default:
          return c.json({ error: "Nieznany typ zdarzenia" }, 400);
      }

      if (!deleted || deleted.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json(deleted[0], 200);
    } catch (error) {
      console.error("Błąd usuwania wydarzenia:", error);
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  }
);
