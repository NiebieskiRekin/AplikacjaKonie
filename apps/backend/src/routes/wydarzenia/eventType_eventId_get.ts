import { db } from "@/backend/db";
import {
  choroby,
  konie,
  leczenia,
  rozrody,
  weterynarze,
  zdarzeniaProfilaktyczne,
  podkucia,
  kowale,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { eventTypeUnionSchema } from "./schema";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { log } from "@/backend/logs/logger";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_eventType_eventId_get = new Hono<auth_vars>().get(
  "/:type{[A-Za-z_-]+}/:id{[0-9]+}",
  describeRoute({
    description:
      "Wyświetl szczegóły wydarzenia o wskazanym typie i identyfikatorze",
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
    const eventId = Number(c.req.param("id"));
    const eventType = c.req.param("type").toLowerCase();
    log(
      "Wydarzenia Get",
      "info",
      `eventId: ${eventId}, eventType: ${eventType}`
    );

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
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
            .innerJoin(konie, eq(choroby.kon, konie.id))
            .where(eq(choroby.id, eventId));
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
            .innerJoin(weterynarze, eq(leczenia.weterynarz, weterynarze.id))
            .innerJoin(choroby, eq(leczenia.choroba, choroby.id))
            .innerJoin(konie, eq(leczenia.kon, konie.id))
            .where(eq(leczenia.id, eventId));
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
            .from(rozrody)
            .innerJoin(weterynarze, eq(rozrody.weterynarz, weterynarze.id))
            .innerJoin(konie, eq(rozrody.kon, konie.id))
            .where(eq(rozrody.id, eventId));
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
            .from(zdarzeniaProfilaktyczne)
            .innerJoin(konie, eq(zdarzeniaProfilaktyczne.kon, konie.id))
            .innerJoin(
              weterynarze,
              eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
            )
            .where(eq(zdarzeniaProfilaktyczne.id, eventId));
          break;
        case "podkucie":
          events = await db
            .select({
              _id: podkucia.id,
              dataZdarzenia: podkucia.dataZdarzenia,
              dataWaznosci: podkucia.dataWaznosci,
              kowal: kowale.imieINazwisko,
              nazwaKonia: konie.nazwa,
            })
            .from(podkucia)
            .innerJoin(konie, eq(podkucia.kon, konie.id))
            .innerJoin(kowale, eq(podkucia.kowal, kowale.id))
            .where(eq(podkucia.id, eventId));
          break;
        default:
          return c.json({ error: "Nieznany typ zdarzenia" }, 400);
      }

      return c.json(events, 200);
    } catch (error) {
      log(
        "Wydarzenia Get",
        "error",
        "Błąd pobierania wydarzeń:",
        error as Error
      );
      return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  }
);
