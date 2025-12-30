import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  konie,
  member,
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

export const konie_id_active_events_get = new Hono<auth_vars>().get(
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
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    const userId = session?.user.id;
    if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    try {
      const latestPodkucie = await db
        .select()
        .from(podkucia)
        .innerJoin(konie, eq(konie.id, podkucia.kon))
        .innerJoin(member, eq(member.organizationId, konie.hodowla))
        .where(and(eq(podkucia.kon, horseId), eq(member.userId, userId)))
        .orderBy(desc(podkucia.dataZdarzenia))
        .limit(1)
        .then((res) => res[0]);

      // Pobieramy najnowsze zdarzenia profilaktyczne dla każdego unikalnego rodzaju zdarzenia
      const latestProfilaktyczneEvents = await db
        .selectDistinctOn([zdarzeniaProfilaktyczne.rodzajZdarzenia])
        .from(zdarzeniaProfilaktyczne)
        .innerJoin(konie, eq(konie.id, zdarzeniaProfilaktyczne.kon))
        .innerJoin(member, eq(member.organizationId, konie.hodowla))
        .where(
          and(
            eq(zdarzeniaProfilaktyczne.kon, horseId),
            eq(member.userId, userId)
          )
        )
        .orderBy(
          zdarzeniaProfilaktyczne.rodzajZdarzenia,
          desc(zdarzeniaProfilaktyczne.dataZdarzenia)
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
