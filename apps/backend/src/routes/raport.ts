import { Hono } from "hono";
import { db } from "../db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  users,
  podkucia,
  choroby,
  zdarzeniaProfilaktyczne,
  leczenia,
  rozrody,
  konie,
  zdjeciaKoni,
  weterynarze,
  kowale,
} from "../db/schema";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { generateV4ReadSignedUrl } from "./images";
import { RodzajZdarzeniaRozrodczego } from "../db/types";

const eventTypes = z.enum([
  "Podkucia",
  "Szczepienie",
  "Odrobaczanie",
  "Podanie suplementów",
  "Dentysta",
  "Inne",
  "Choroby",
  "Leczenia",
  "Rozrody",
]);

export const raportSchema = z.object({
  events: z.array(
    z.object({
      event: eventTypes,
      all: z.boolean(), // true lub false
      from: z.string().nullable(), // ISO string lub null
      to: z.string().nullable(), // ISO string lub null
    })
  ),
});

// Zmień definicję tego pomocniczego typu, jeśli chcesz zmienić zwracany format przez ten endpoint
type HorseReportResult = {
  horse: typeof konie.$inferSelect;
  images: string[];
  Podkucia?: {
    dataZdarzenia: string;
    dataWaznosci: string | null;
    Kowal: string | null;
  }[];
  Szczepienie?: {
    dataZdarzenia: string;
    dataWaznosci: string | null;
    opisZdarzenia: string | null;
    Weterynarz: string | null;
  }[];
  Odrobaczanie?: {
    dataZdarzenia: string;
    dataWaznosci: string | null;
    opisZdarzenia: string | null;
    Weterynarz: string | null;
  }[];
  PodanieSuplementów?: {
    dataZdarzenia: string;
    dataWaznosci: string | null;
    opisZdarzenia: string | null;
    Weterynarz: string | null;
  }[];
  Dentysta?: {
    dataZdarzenia: string;
    dataWaznosci: string | null;
    opisZdarzenia: string | null;
    Weterynarz: string | null;
  }[];
  Inne?: {
    dataZdarzenia: string;
    dataWaznosci: string | null;
    opisZdarzenia: string | null;
    Weterynarz: string | null;
  }[];
  Choroby?: {
    dataRozpoczecia: string;
    dataZakonczenia: string | null;
    opisZdarzenia: string | null;
  }[];
  Leczenia?: {
    dataZdarzenia: string;
    Weterynarz: string | null;
    Choroba: string | null;
    opisZdarzenia: string | null;
  }[];
  Rozrody?: {
    dataZdarzenia: string;
    Weterynarz: string | null;
    rodzajZdarzenia: RodzajZdarzeniaRozrodczego;
    opisZdarzenia: string | null;
  }[];
};

const raport = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .post("/:id{[0-9]+}", zValidator("json", raportSchema), async (c) => {
    try {
      const userId = getUserFromContext(c);
      if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const { events } = c.req.valid("json");
      const horseId = Number(c.req.param("id"));

      const hodowla = await db
        .select({ hodowlaId: users.hodowla })
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]);

      if (!hodowla) {
        return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
      }

      // const eventTableMap = {
      //   // Wspólna tabela z rodzajem zdarzenia
      //   "Szczepienie": { table: zdarzeniaProfilaktyczne, filterBy: "Szczepienie" },
      //   "Odrobaczanie": { table: zdarzeniaProfilaktyczne, filterBy: "Odrobaczanie" },
      //   "Podanie suplementów": { table: zdarzeniaProfilaktyczne, filterBy: "Podanie suplementów" },
      //   "Dentysta": { table: zdarzeniaProfilaktyczne, filterBy: "Dentysta" },
      //   "Inne": { table: zdarzeniaProfilaktyczne, filterBy: "Inne" },
      //   // Osobne tabele
      //   "Choroby": { table: choroby },
      //   "Leczenia": { table: leczenia },
      //   "Rozrody": { table: rozrody },
      //   "Podkucia": { table: podkucia }
      // };

      // const result: Record<string, any[]> = {};

      const horse = await db
        .select()
        .from(konie)
        .where(eq(konie.id, horseId))
        .then((res) => res[0]);

      const images_names = await db
        .select({ name: zdjeciaKoni.id })
        .from(zdjeciaKoni)
        .where(eq(zdjeciaKoni.kon, horseId));

      const images_signed_urls = await Promise.all(
        images_names.map((img) => generateV4ReadSignedUrl(img.name))
      );

      const result: Partial<HorseReportResult> = {
        horse,
        images: images_signed_urls,
      };

      for (const { event, all, from, to } of events) {
        const dateFrom = from ? new Date(from).toDateString() : null;
        const dateTo = to ? new Date(to).toDateString() : null;

        switch (event) {
          case "Podkucia": {
            const podkuciaClauses = [eq(podkucia.kon, horseId)];
            if (!all && dateFrom && dateTo) {
              podkuciaClauses.push(
                gte(podkucia.dataZdarzenia, dateFrom),
                lte(podkucia.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: podkucia.dataZdarzenia,
                dataWaznosci: podkucia.dataWaznosci,
                Kowal: kowale.imieINazwisko,
              })
              .from(podkucia)
              .leftJoin(kowale, eq(podkucia.kowal, kowale.id))
              .where(and(...podkuciaClauses))
              .orderBy(desc(podkucia.dataZdarzenia));

            result.Podkucia = rows;
            break;
          }

          case "Szczepienie": {
            const szczepieniaClauses = [
              and(
                eq(zdarzeniaProfilaktyczne.kon, horseId),
                eq(zdarzeniaProfilaktyczne.rodzajZdarzenia, "Szczepienie")
              ),
            ];
            if (!all && dateFrom && dateTo) {
              szczepieniaClauses.push(
                gte(zdarzeniaProfilaktyczne.dataZdarzenia, dateFrom),
                lte(zdarzeniaProfilaktyczne.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
                dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
                opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
                Weterynarz: weterynarze.imieINazwisko,
              })
              .from(zdarzeniaProfilaktyczne)
              .leftJoin(
                weterynarze,
                eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
              )
              .where(and(...szczepieniaClauses))
              .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia));

            result.Szczepienie = rows;
            break;
          }
          case "Odrobaczanie": {
            const odrobaczaniaClauses = [
              and(
                eq(zdarzeniaProfilaktyczne.kon, horseId),
                eq(zdarzeniaProfilaktyczne.rodzajZdarzenia, "Odrobaczanie")
              ),
            ];
            if (!all && dateFrom && dateTo) {
              odrobaczaniaClauses.push(
                gte(zdarzeniaProfilaktyczne.dataZdarzenia, dateFrom),
                lte(zdarzeniaProfilaktyczne.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
                dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
                opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
                Weterynarz: weterynarze.imieINazwisko,
              })
              .from(zdarzeniaProfilaktyczne)
              .leftJoin(
                weterynarze,
                eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
              )
              .where(and(...odrobaczaniaClauses))
              .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia));

            result.Odrobaczanie = rows;
            break;
          }
          case "Podanie suplementów": {
            const supClauses = [
              and(
                eq(zdarzeniaProfilaktyczne.kon, horseId),
                eq(
                  zdarzeniaProfilaktyczne.rodzajZdarzenia,
                  "Podanie suplementów"
                )
              ),
            ];
            if (!all && dateFrom && dateTo) {
              supClauses.push(
                gte(zdarzeniaProfilaktyczne.dataZdarzenia, dateFrom),
                lte(zdarzeniaProfilaktyczne.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
                dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
                opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
                Weterynarz: weterynarze.imieINazwisko,
              })
              .from(zdarzeniaProfilaktyczne)
              .leftJoin(
                weterynarze,
                eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
              )
              .where(and(...supClauses))
              .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia));

            result.PodanieSuplementów = rows;
            break;
          }
          case "Dentysta": {
            const dentystaClauses = [
              and(
                eq(zdarzeniaProfilaktyczne.kon, horseId),
                eq(zdarzeniaProfilaktyczne.rodzajZdarzenia, "Dentysta")
              ),
            ];
            if (!all && dateFrom && dateTo) {
              dentystaClauses.push(
                gte(zdarzeniaProfilaktyczne.dataZdarzenia, dateFrom),
                lte(zdarzeniaProfilaktyczne.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
                dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
                opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
                Weterynarz: weterynarze.imieINazwisko,
              })
              .from(zdarzeniaProfilaktyczne)
              .leftJoin(
                weterynarze,
                eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
              )
              .where(and(...dentystaClauses))
              .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia));

            result.Dentysta = rows;
            break;
          }
          case "Inne": {
            const inneClauses = [
              and(
                eq(zdarzeniaProfilaktyczne.kon, horseId),
                eq(zdarzeniaProfilaktyczne.rodzajZdarzenia, "Inne")
              ),
            ];
            if (!all && dateFrom && dateTo) {
              inneClauses.push(
                gte(zdarzeniaProfilaktyczne.dataZdarzenia, dateFrom),
                lte(zdarzeniaProfilaktyczne.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
                dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
                opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
                Weterynarz: weterynarze.imieINazwisko,
              })
              .from(zdarzeniaProfilaktyczne)
              .leftJoin(
                weterynarze,
                eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
              )
              .where(and(...inneClauses))
              .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia));

            result.Inne = rows;
            break;
          }

          case "Choroby": {
            const chorobyClauses = [eq(choroby.kon, horseId)];
            if (!all && dateFrom && dateTo) {
              chorobyClauses.push(
                gte(choroby.dataRozpoczecia, dateFrom),
                lte(choroby.dataRozpoczecia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataRozpoczecia: choroby.dataRozpoczecia,
                dataZakonczenia: choroby.dataZakonczenia,
                opisZdarzenia: choroby.opisZdarzenia,
              })
              .from(choroby)
              .where(and(...chorobyClauses))
              .orderBy(desc(choroby.dataRozpoczecia));

            result.Choroby = rows;
            break;
          }

          case "Leczenia": {
            const leczeniaClauses = [eq(leczenia.kon, horseId)];
            if (!all && dateFrom && dateTo) {
              leczeniaClauses.push(
                gte(leczenia.dataZdarzenia, dateFrom),
                lte(leczenia.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: leczenia.dataZdarzenia,
                Weterynarz: weterynarze.imieINazwisko,
                Choroba: choroby.opisZdarzenia,
                opisZdarzenia: leczenia.opisZdarzenia,
              })
              .from(leczenia)
              .leftJoin(weterynarze, eq(leczenia.weterynarz, weterynarze.id))
              .leftJoin(choroby, eq(leczenia.choroba, choroby.id))
              .where(and(...leczeniaClauses))
              .orderBy(desc(leczenia.dataZdarzenia));

            result.Leczenia = rows;
            break;
          }

          case "Rozrody": {
            const rozrodyClauses = [eq(rozrody.kon, horseId)];
            if (!all && dateFrom && dateTo) {
              rozrodyClauses.push(
                gte(rozrody.dataZdarzenia, dateFrom),
                lte(rozrody.dataZdarzenia, dateTo)
              );
            }

            const rows = await db
              .select({
                dataZdarzenia: rozrody.dataZdarzenia,
                Weterynarz: weterynarze.imieINazwisko,
                rodzajZdarzenia: rozrody.rodzajZdarzenia,
                opisZdarzenia: rozrody.opisZdarzenia,
              })
              .from(rozrody)
              .leftJoin(weterynarze, eq(rozrody.weterynarz, weterynarze.id))
              .where(and(...rozrodyClauses))
              .orderBy(desc(rozrody.dataZdarzenia));

            result.Rozrody = rows;
            break;
          }
        }
      }

      return c.json(result as HorseReportResult, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  });

export default raport;
