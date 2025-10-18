import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  podkucia,
  podkuciaSelectSchema,
  zdarzeniaProfilaktyczne,
  zdarzeniaProfilaktyczneSelectSchema,
} from "@/backend/db/schema";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const konie_id_active_events_get_response_success = z.object({
  podkucie: podkuciaSelectSchema.nullable(),
  profilaktyczne: z.array(zdarzeniaProfilaktyczneSelectSchema),
});

export const konie_id_active_events_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/:id{[0-9]+}/active-events",
  describeRoute({
    description:
      "Wyświetl informacje o aktywnych wydarzeniach dla danego konia",
    responses: {
      200: {
        // ContentfulStatusCode
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_active_events_get_response_success),
          },
        },
      },
      400: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
      401: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
      500: {
        description: "Błąd serwera",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
    },
  }),
  async (c) => {
    const userId = getUserFromContext(c);
    if (!userId) {
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }

    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    try {
      const latestPodkucie = await db
        .select()
        .from(podkucia)
        .where(eq(podkucia.kon, horseId))
        .orderBy(desc(podkucia.dataZdarzenia))
        .limit(1)
        .then((res) => res[0]);

      // Pobieramy najnowsze zdarzenia profilaktyczne dla każdego unikalnego rodzaju zdarzenia
      const eventTypes = [
        "Odrobaczanie",
        "Podanie suplementów",
        "Szczepienie",
        "Dentysta",
      ];

      const latestProfilaktyczneEvents = await Promise.all(
        eventTypes.map(async (eventType) => {
          return db
            .select()
            .from(zdarzeniaProfilaktyczne)
            .where(
              and(
                eq(zdarzeniaProfilaktyczne.kon, horseId),
                eq(
                  zdarzeniaProfilaktyczne.rodzajZdarzenia,
                  eventType as
                    | "Odrobaczanie"
                    | "Podanie suplementów"
                    | "Szczepienie"
                    | "Dentysta"
                    | "Inne"
                )
              )
            )
            .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia))
            .limit(1)
            .then((res) => res[0] || null);
        })
      );

      const activeEvents = {
        podkucie: latestPodkucie || null,
        profilaktyczne: latestProfilaktyczneEvents.filter(
          (event) => event !== null
        ),
      };

      return c.json(activeEvents);
    } catch (error) {
      log(
        "Konie ID events",
        "error",
        "Błąd pobierania aktywnych zdarzeń:",
        error as Error
      );
      return c.json({ error: "Błąd pobierania aktywnych zdarzeń." }, 500);
    }
  }
);
