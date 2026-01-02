import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { eq, sql, desc, and } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";
import { db } from "@/backend/db";
import {
  rozrody,
  choroby,
  leczenia,
  podkucia,
  zdarzeniaProfilaktyczne,
  konie,
} from "@/backend/db/schema";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const konie_id_events_get_response_success = z.array(
  z.object({
    type: z.enum(["rozród", "choroba", "leczenie", "podkucie", "profilaktyka"]),
    date: z.iso.date(),
    description: z.string(),
  })
);

export const konie_id_events_get = new Hono<auth_vars>().get(
  "/:id{[0-9]+}/events",
  describeRoute({
    description: "Wyświetl informacje o wydarzeniach dla danego konia",
    responses: {
      200: {
        // ContentfulStatusCode
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_events_get_response_success),
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
    const orgId = session?.session.activeOrganizationId;
    if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia." }, 400);
    }

    try {
      const after_union = await union(
        db
          .select({
            type: sql<string>`'rozród'`,
            date: rozrody.dataZdarzenia,
            description: rozrody.opisZdarzenia,
          })
          .from(rozrody)
          .innerJoin(konie, eq(konie.id, rozrody.kon))
          .where(and(eq(rozrody.kon, horseId), eq(konie.hodowla, orgId)))
          .orderBy(desc(rozrody.dataZdarzenia))
          .limit(5),
        db
          .select({
            type: sql<string>`'choroba'`,
            date: choroby.dataRozpoczecia,
            description: choroby.opisZdarzenia,
          })
          .from(choroby)
          .innerJoin(konie, eq(konie.id, choroby.kon))
          .where(and(eq(choroby.kon, horseId), eq(konie.hodowla, orgId)))
          .orderBy(desc(choroby.dataRozpoczecia))
          .limit(5),
        db
          .select({
            type: sql<string>`'leczenie'`,
            date: leczenia.dataZdarzenia,
            description: leczenia.opisZdarzenia,
          })
          .from(leczenia)
          .innerJoin(konie, eq(konie.id, leczenia.kon))
          .where(and(eq(leczenia.kon, horseId), eq(konie.hodowla, orgId)))
          .orderBy(desc(leczenia.dataZdarzenia))
          .limit(5),
        db
          .select({
            type: sql<string>`'podkucie'`,
            date: podkucia.dataZdarzenia,
            description: sql<string>`coalesce(to_char(${podkucia.dataWaznosci}, 'DD-MM-YYYY'), 'nie podano daty ważności')`,
          })
          .from(podkucia)
          .innerJoin(konie, eq(konie.id, podkucia.kon))
          .where(and(eq(podkucia.kon, horseId), eq(konie.hodowla, orgId)))
          .orderBy(desc(podkucia.dataZdarzenia))
          .limit(5),
        db
          .select({
            type: sql<string>`'profilaktyka'`,
            date: zdarzeniaProfilaktyczne.dataZdarzenia,
            description: zdarzeniaProfilaktyczne.opisZdarzenia,
          })
          .from(zdarzeniaProfilaktyczne)
          .innerJoin(konie, eq(konie.id, zdarzeniaProfilaktyczne.kon))
          .where(
            and(
              eq(zdarzeniaProfilaktyczne.kon, horseId),
              eq(konie.hodowla, orgId)
            )
          )
          .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia))
          .limit(5)
      )
        .orderBy(desc(sql`2`))
        .limit(5);

      return c.json(after_union);
    } catch (error) {
      log(
        "Konie ID Events",
        "error",
        "Błąd pobierania zdarzeń konia:",
        error as Error
      );
      return c.json({ error: "Błąd pobierania zdarzeń konia." }, 500);
    }
  }
);
