import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  weterynarze,
  konie,
  zdarzeniaProfilaktyczne,
  podkucia,
  kowale,
} from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";
import { unionAll } from "drizzle-orm/pg-core";

const resultEventSchema = z.array(
  z.object({
    horse: z.string(),
    date: z.iso.date(),
    rodzajZdarzenia: z.enum([
      "Odrobaczanie",
      "Podanie suplementów",
      "Szczepienie",
      "Dentysta",
      "Inne",
      "Podkuwanie",
    ]),
    dataWaznosci: z.iso.date().nullable(),
    osobaImieNazwisko: z.string(),
    opisZdarzenia: z.string().nullable(),
    highlighted: z.boolean(),
  })
);

export const wydarzenia_get = new Hono<auth_vars>().get(
  "/",
  describeRoute({
    description: "Wyświetl listę zdarzeń",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(resultEventSchema) },
        },
      },
      403: {
        description: "Bład zapytania",
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
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const konie_condition = and(
        eq(konie.hodowla, orgId),
        eq(konie.active, true)
      );

      const zdarzenia = db
        .select({
          horse: konie.nazwa || "Nieznany koń",
          date: zdarzeniaProfilaktyczne.dataZdarzenia,
          dataWaznosci: sql<string>`coalesce(to_char(${zdarzeniaProfilaktyczne.dataWaznosci}, 'YYYY-MM-DD'), '-')`,
          rodzajZdarzenia: sql<string>`cast(${zdarzeniaProfilaktyczne.rodzajZdarzenia} as text)`,
          opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
          osobaImieNazwisko: weterynarze.imieINazwisko || "Brak danych",
        })
        .from(zdarzeniaProfilaktyczne)
        .innerJoin(
          weterynarze,
          eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
        )
        .innerJoin(konie, eq(zdarzeniaProfilaktyczne.kon, konie.id))
        .where(konie_condition);

      const podkuciaData = db
        .select({
          horse: konie.nazwa || "Nieznany koń",
          date: podkucia.dataZdarzenia,
          rodzajZdarzenia: sql<string>`'Podkuwanie'`,
          dataWaznosci: sql<string>`coalesce(to_char(${podkucia.dataWaznosci}, 'YYYY-MM-DD'), '-')`,
          opisZdarzenia: sql<string>`-`,
          osobaImieNazwisko: kowale.imieINazwisko || "Brak danych",
        })
        .from(podkucia)
        .innerJoin(kowale, eq(podkucia.kowal, kowale.id))
        .innerJoin(konie, eq(podkucia.kon, konie.id))
        .where(konie_condition);

      const events = unionAll(zdarzenia, podkuciaData).as("sq");

      const result = await db
        .select({
          horse: events.horse,
          date: events.date,
          dataWaznosci: events.dataWaznosci,
          rodzajZdarzenia: events.rodzajZdarzenia,
          opisZdarzenia: events.opisZdarzenia,
          osobaImieNazwisko: events.osobaImieNazwisko,
          highlighted: sql<boolean>`
            (ROW_NUMBER() OVER (
              PARTITION BY ${events.horse}, ${events.rodzajZdarzenia} 
              ORDER BY ${events.date} DESC
            )) = 1
          `,
        })
        .from(events)
        .orderBy(desc(events.date));

      return c.json(result, 200);
    } catch (e: unknown) {
      if (e instanceof Error) {
        log("Wydarzenia", "error", "", e);
      }
      return c.json({ error: "Błąd serwera" }, 500);
    }
  }
);
