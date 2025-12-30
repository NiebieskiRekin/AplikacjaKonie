import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import {
  weterynarze,
  konie,
  zdarzeniaProfilaktyczne,
  podkucia,
  kowale,
  choroby,
  leczenia,
  rozrody,
} from "@/backend/db/schema";
import { auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { eventTypeUnionSchema } from "./schema";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { log } from "@/backend/logs/logger";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_horseId_eventType_get = new Hono<auth_vars>().get(
  "/:id{[0-9]+}/:type{[A-Za-z_]+}",
  describeRoute({
    description: "Wyświetl listę wydarzeń danego typu dla wybranego konia",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
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
        description: "Bład serwera",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
        },
      },
    },
  }),
  async (c) => {
    const horseId = Number(c.req.param("id"));
    const eventType = c.req.param("type").toLowerCase();
    log(
      "Wydarzenia Get by horse",
      "info",
      `horseId: ${horseId}, eventType: ${eventType}`
    );

    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    try {
      let events;

      switch (eventType) {
        case "choroby":
          events = await db
            .select({
              _id: choroby.id,
              dataRozpoczecia: choroby.dataRozpoczecia,
              dataZakonczenia: choroby.dataZakonczenia,
              opisZdarzenia: choroby.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(choroby)
            .leftJoin(konie, eq(choroby.kon, konie.id))
            .where(eq(konie.id, horseId));
          break;
        case "leczenia":
          events = await db
            .select({
              _id: leczenia.id,
              dataZdarzenia: leczenia.dataZdarzenia,
              weterynarz: weterynarze.imieINazwisko,
              choroba: choroby.opisZdarzenia,
              opisZdarzenia: leczenia.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(leczenia)
            .leftJoin(weterynarze, eq(leczenia.weterynarz, weterynarze.id))
            .leftJoin(choroby, eq(leczenia.choroba, choroby.id))
            .rightJoin(konie, eq(leczenia.kon, konie.id))
            .where(eq(konie.id, horseId));
          break;
        case "rozrody":
          events = await db
            .select({
              _id: rozrody.id,
              dataZdarzenia: rozrody.dataZdarzenia,
              weterynarz: weterynarze.imieINazwisko,
              rodzajZdarzenia: rozrody.rodzajZdarzenia,
              opisZdarzenia: rozrody.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(konie)
            .leftJoin(rozrody, eq(rozrody.kon, konie.id))
            .leftJoin(weterynarze, eq(rozrody.weterynarz, weterynarze.id))
            .where(eq(konie.id, horseId));
          break;
        case "zdarzenia_profilaktyczne":
          events = await db
            .select({
              _id: zdarzeniaProfilaktyczne.id,
              dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
              dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
              weterynarz: weterynarze.imieINazwisko,
              rodzajZdarzenia: zdarzeniaProfilaktyczne.rodzajZdarzenia,
              opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(konie)
            .leftJoin(
              zdarzeniaProfilaktyczne,
              eq(zdarzeniaProfilaktyczne.kon, konie.id)
            )
            .leftJoin(
              weterynarze,
              eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
            )
            .where(eq(konie.id, horseId));
          break;
        case "podkucia":
          events = await db
            .select({
              _id: podkucia.id,
              dataZdarzenia: podkucia.dataZdarzenia,
              dataWaznosci: podkucia.dataWaznosci,
              kowal: kowale.imieINazwisko,
              nazwaKonia: konie.nazwa,
            })
            .from(konie)
            .leftJoin(podkucia, eq(podkucia.kon, konie.id))
            .leftJoin(kowale, eq(podkucia.kowal, kowale.id))
            .where(eq(konie.id, horseId));
          break;
        default:
          return c.json({ error: "Nieznany typ zdarzenia" }, 400);
      }

      return c.json(events, 200);
    } catch (error) {
      log(
        "Wydarzenia Get by horse",
        "error",
        "Błąd pobierania wydarzeń:",
        error as Error
      );
      return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  }
);
