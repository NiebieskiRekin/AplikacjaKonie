import { Hono } from "hono";
import { db } from "../../db";
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
} from "../../db/schema";
import { UserPayload } from "../../middleware/auth";
// import { describeRoute } from "hono-openapi";
// import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
// import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "../constants";
import { resolver } from "hono-openapi/zod";
import { z } from "@hono/zod-openapi";
import {
  RodzajeZdarzenProfilaktycznych,
  RodzajeZdarzenRozrodczych,
} from "@/backend/db/types";
// import { z } from "@hono/zod-openapi";

const common = z.object({
  _id: z.number(),
  nazwaKonia: z.string(),
});

const big_union = z.array(
  z.union([
    common.extend({
      dataRozpoczecia: z.string().date(),
      dataZakonczenia: z.string().date().nullable(),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      weterynarz: z.string(),
      choroba: z.string().nullable(),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      weterynarz: z.string(),
      rodzajZdarzenia: z.enum(RodzajeZdarzenRozrodczych),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      dataWaznosci: z.string().date().nullable(),
      weterynarz: z.string(),
      rodzajZdarzenia: z.enum(RodzajeZdarzenProfilaktycznych),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      dataWaznosci: z.string().date().nullable(),
      kowal: z.string(),
    }),
  ])
);

export const wydarzenia_horseId_eventType_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/:id{[0-9]+}/:type{[A-Za-z_]+}",
  describeRoute({
    description: "Wyświetl listę wydarzeń danego typu dla wybranego konia",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(big_union) },
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
    console.log(horseId, eventType);

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
            .innerJoin(konie, eq(choroby.kon, konie.id))
            .where(eq(choroby.kon, horseId));
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
            .where(eq(leczenia.kon, horseId));
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
            .where(eq(rozrody.kon, horseId));
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
            .where(eq(zdarzeniaProfilaktyczne.kon, horseId));
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
            .from(podkucia)
            .innerJoin(konie, eq(podkucia.kon, konie.id))
            .innerJoin(kowale, eq(podkucia.kowal, kowale.id))
            .where(eq(podkucia.kon, horseId));
          break;
        default:
          return c.json({ error: "Nieznany typ zdarzenia" }, 400);
      }

      // if (events.length === 0) {
      //   const horse = await db
      //     .select({ nazwaKonia: konie.nazwa })
      //     .from(konie)
      //     .where(eq(konie.id, horseId))
      //     .then((res) => res[0]);

      //   if (horse){
      //     return c.json(horse, 200)
      //   } else {
      //     return c.json({ error: "Koń nie znaleziony" }, 404)
      //   }
      // }

      return c.json(events, 200);
    } catch (error) {
      console.error("Błąd pobierania wydarzeń:", error);
      return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  }
);
