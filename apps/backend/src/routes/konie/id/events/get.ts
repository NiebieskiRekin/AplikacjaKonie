import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { eq, sql, desc } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";
import { db } from "@/backend/db";
import {
  rozrody,
  choroby,
  leczenia,
  podkucia,
  zdarzeniaProfilaktyczne,
} from "@/backend/db/schema";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const konie_id_events_get_response_success = z.array(
  z.object({
    type: z.enum(["rozród", "choroba", "leczenie", "podkucie", "profilaktyka"]),
    date: z.string().date(),
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
    const userId = getUserFromContext(c);
    if (!userId) {
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }

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
          .where(eq(rozrody.kon, horseId))
          .orderBy(desc(rozrody.dataZdarzenia))
          .limit(5),
        db
          .select({
            type: sql<string>`'choroba'`,
            date: choroby.dataRozpoczecia,
            description: choroby.opisZdarzenia,
          })
          .from(choroby)
          .where(eq(choroby.kon, horseId))
          .orderBy(desc(choroby.dataRozpoczecia))
          .limit(5),
        db
          .select({
            type: sql<string>`'leczenie'`,
            date: leczenia.dataZdarzenia,
            description: leczenia.opisZdarzenia,
          })
          .from(leczenia)
          .where(eq(leczenia.kon, horseId))
          .orderBy(desc(leczenia.dataZdarzenia))
          .limit(5),
        db
          .select({
            type: sql<string>`'podkucie'`,
            date: podkucia.dataZdarzenia,
            description: sql<string>`coalesce(to_char(data_waznosci, 'DD-MM-YYYY'),'nie podano daty ważności')`,
          })
          .from(podkucia)
          .where(eq(podkucia.kon, horseId))
          .orderBy(desc(podkucia.dataZdarzenia))
          .limit(5),
        db
          .select({
            type: sql<string>`'profilaktyka'`,
            date: zdarzeniaProfilaktyczne.dataZdarzenia,
            description: zdarzeniaProfilaktyczne.opisZdarzenia,
          })
          .from(zdarzeniaProfilaktyczne)
          .where(eq(zdarzeniaProfilaktyczne.kon, horseId))
          .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia))
          .limit(5)
      )
        .orderBy(sql`2 desc`)
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
