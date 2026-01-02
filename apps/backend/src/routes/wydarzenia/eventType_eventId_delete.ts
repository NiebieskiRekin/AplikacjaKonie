import { db } from "@/backend/db";
import {
  choroby,
  leczenia,
  rozrody,
  zdarzeniaProfilaktyczne,
  podkucia,
  konie,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { eventTypeUnionSchema } from "./schema";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { log } from "@/backend/logs/logger";

export const wydarzenia_eventType_eventId_delete = new Hono<auth_vars>().delete(
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

      let deleted;

      switch (eventType) {
        case "choroby":
          deleted = await db
            .delete(choroby)
            .where(
              and(eq(choroby.id, eventId), inArray(choroby.kon, horsesSubquery))
            )
            .returning();
          break;
        case "leczenia":
          deleted = await db
            .delete(leczenia)
            .where(
              and(
                eq(leczenia.id, eventId),
                inArray(leczenia.kon, horsesSubquery)
              )
            )
            .returning();
          break;
        case "rozrody":
          deleted = await db
            .delete(rozrody)
            .where(
              and(eq(rozrody.id, eventId), inArray(rozrody.kon, horsesSubquery))
            )
            .returning();
          break;
        case "zdarzenia_profilaktyczne":
          deleted = await db
            .delete(zdarzeniaProfilaktyczne)
            .where(
              and(
                eq(zdarzeniaProfilaktyczne.id, eventId),
                inArray(zdarzeniaProfilaktyczne.kon, horsesSubquery)
              )
            )
            .returning();
          break;
        case "podkucie":
        case "podkucia":
          deleted = await db
            .delete(podkucia)
            .where(
              and(
                eq(podkucia.id, eventId),
                inArray(podkucia.kon, horsesSubquery)
              )
            )
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
      log(
        "Wydarzenia Delete",
        "error",
        "Błąd usuwania wydarzenia:",
        error as Error
      );
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  }
);
