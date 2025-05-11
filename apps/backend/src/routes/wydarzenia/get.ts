import { Hono } from "hono";
import { db } from "../../db";
import { eq, and, or } from "drizzle-orm";
import {
  weterynarze,
  users,
  konie,
  zdarzeniaProfilaktyczne,
  podkucia,
  kowale,
} from "../../db/schema";
import { getUserFromContext, UserPayload } from "../../middleware/auth";
import "@hono/zod-openapi";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "../constants";
import { resolver } from "hono-openapi/zod";
import { z } from "@hono/zod-openapi";

const resultEventSchema = z.array(
  z.object({
    horse: z.string(),
    date: z.string().date(),
    rodzajZdarzenia: z.enum([
      "Odrobaczanie",
      "Podanie suplementów",
      "Szczepienie",
      "Dentysta",
      "Inne",
      "Podkuwanie",
    ]),
    dataWaznosci: z.string().date().nullable(),
    osobaImieNazwisko: z.string(),
    opisZdarzenia: z.string().nullable(),
    highlighted: z.boolean(),
  })
);

export const wydarzenia_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
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
      const user = getUserFromContext(c);
      // if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const hodowla = await db
        .select({ hodowla: users.hodowla })
        .from(users)
        .where(eq(users.id, user))
        .then((res) => res[0]?.hodowla);

      if (!hodowla) {
        return c.json({ error: "Nie znaleziono hodowli użytkownika" }, 403);
      }

      const konieUzytkownika = await db
        .select({ id: konie.id, nazwa: konie.nazwa })
        .from(konie)
        .where(and(eq(konie.hodowla, hodowla), eq(konie.active, true)));

      const konieMap = Object.fromEntries(
        konieUzytkownika.map((kon) => [kon.id, kon.nazwa])
      );

      const zdarzenia = await db
        .select({
          id: zdarzeniaProfilaktyczne.id,
          kon: zdarzeniaProfilaktyczne.kon,
          dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
          dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
          rodzajZdarzenia: zdarzeniaProfilaktyczne.rodzajZdarzenia,
          opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
          weterynarzId: zdarzeniaProfilaktyczne.weterynarz,
          weterynarzImieNazwisko: weterynarze.imieINazwisko,
        })
        .from(zdarzeniaProfilaktyczne)
        .innerJoin(
          weterynarze,
          eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
        )
        .where(
          or(
            ...konieUzytkownika.map((kon) =>
              eq(zdarzeniaProfilaktyczne.kon, kon.id)
            )
          )
        );

      const podkuciaData = await db
        .select({
          id: podkucia.id,
          kon: podkucia.kon,
          dataPodkucia: podkucia.dataZdarzenia,
          dataWaznosci: podkucia.dataWaznosci,
          kowalId: podkucia.kowal,
          kowalImieNazwisko: kowale.imieINazwisko,
        })
        .from(podkucia)
        .innerJoin(kowale, eq(podkucia.kowal, kowale.id))
        .where(or(...konieUzytkownika.map((kon) => eq(podkucia.kon, kon.id))));

      const events = [
        ...zdarzenia.map((event) => ({
          horse: konieMap[event.kon] || "Nieznany koń",
          date: event.dataZdarzenia,
          rodzajZdarzenia: event.rodzajZdarzenia,
          dataWaznosci: event.dataWaznosci || "-",
          osobaImieNazwisko: event.weterynarzImieNazwisko || "Brak danych",
          opisZdarzenia: event.opisZdarzenia,
          highlighted: false,
        })),
        ...podkuciaData.map((event) => ({
          horse: konieMap[event.kon] || "Nieznany koń",
          date: event.dataPodkucia,
          rodzajZdarzenia: "Podkuwanie",
          dataWaznosci: event.dataWaznosci || "-",
          osobaImieNazwisko: event.kowalImieNazwisko || "Brak danych",
          opisZdarzenia: "-",
          highlighted: false,
        })),
      ];

      const latestByCategory = new Map<
        string,
        { date: string; index: number }
      >();

      events.forEach((event, index) => {
        const key = `${event.horse}-${event.rodzajZdarzenia}`;
        const current = latestByCategory.get(key);
        if (
          !current ||
          new Date(event.date).getTime() > new Date(current.date).getTime()
        ) {
          latestByCategory.set(key, { date: event.date, index });
        }
      });

      events.forEach((event, index) => {
        const key = `${event.horse}-${event.rodzajZdarzenia}`;
        event.highlighted = latestByCategory.get(key)?.index === index;
      });

      events.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return c.json(events);
    } catch {
      return c.json({ error: "Błąd serwera" }, 500);
    }
  }
);
