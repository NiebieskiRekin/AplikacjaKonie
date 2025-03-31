import { Hono } from "hono";
import { db } from "../db";
import { eq, and, gte, lte } from "drizzle-orm";
import { users, podkucia, choroby, zdarzeniaProfilaktyczne, leczenia, rozrody, konie, zdjeciaKoni, weterynarze, kowale } from "../db/schema";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { generateV4ReadSignedUrl } from "./images";

const eventTypes = z.enum([
  "Podkucia",
  "Szczepienie",
  "Odrobaczanie",
  "Podanie suplementów",
  "Dentysta",
  "Inne",
  "Choroby",
  "Leczenia",
  "Rozrody"
]);

export const raportSchema = z.object({
    events: z.array(
      z.object({
        event: eventTypes,
        all: z.boolean(),         // true lub false
        from: z.string().nullable(), // ISO string lub null
        to: z.string().nullable(),   // ISO string lub null
      })
    )
  });

const raport = new Hono<{ Variables: UserPayload }>()
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
    
      const eventTableMap = {
        // Wspólna tabela z rodzajem zdarzenia
        "Szczepienie": { table: zdarzeniaProfilaktyczne, filterBy: "Szczepienie" },
        "Odrobaczanie": { table: zdarzeniaProfilaktyczne, filterBy: "Odrobaczanie" },
        "Podanie suplementów": { table: zdarzeniaProfilaktyczne, filterBy: "Podanie suplementów" },
        "Dentysta": { table: zdarzeniaProfilaktyczne, filterBy: "Dentysta" },
        "Inne": { table: zdarzeniaProfilaktyczne, filterBy: "Inne" },
        // Osobne tabele
        "Choroby": { table: choroby },
        "Leczenia": { table: leczenia },
        "Rozrody": { table: rozrody },
        "Podkucia": { table: podkucia }
      };
  
      const result: Record<string, any[]> = {};

      const _query = await db.select().from(konie).where(eq(konie.id, horseId)).then((res) => res[0]);

      const images_names = await db
        .select({name: zdjeciaKoni.id})
        .from(zdjeciaKoni)
        .where(eq(zdjeciaKoni.kon, horseId));
      
        const images_signed_urls = await Promise.all(
          images_names.map((img) => generateV4ReadSignedUrl(img.name))
        );

      result["horse"] = [_query, images_signed_urls];
  
      for (const { event, all, from, to } of events) {
        const entry = eventTableMap[event];
        if (!entry) continue;
  
        const whereClauses = [eq(entry.table.kon, horseId)];
  
        if ("filterBy" in entry) {
          const filter_schema = z.enum(["Szczepienie","Odrobaczanie","Podanie suplementów","Dentysta","Inne"])
          const f = filter_schema.parse(entry.filterBy)
          whereClauses.push(eq(entry.table.rodzajZdarzenia, f));
        }
  
        if (!all && from && to) {
          if (event === "Choroby") {
            const entry1 = eventTableMap[event];
            whereClauses.push(
              gte(entry1.table.dataRozpoczecia, new Date(from).toDateString()),
              lte(entry1.table.dataRozpoczecia, new Date(to).toDateString())
            );
          } else {
            const entry1 = eventTableMap[event];
            whereClauses.push(
              gte(entry1.table.dataZdarzenia, new Date(from).toDateString()),
              lte(entry1.table.dataZdarzenia, new Date(to).toDateString())
            );
          }
        }
  
        let rows

        if ('weterynarz' in entry.table) {
            if (entry.table == zdarzeniaProfilaktyczne) {
                rows = await db
                .select({
                ...Object.fromEntries(
                    Object.keys(entry.table).filter(key => !['id', 'kon', 'weterynarz', 'rodzajZdarzenia'].includes(key)).map(key => [key, entry.table[key]])
                ),
                Weterynarz: weterynarze.imieINazwisko
                })
                .from(entry.table)
                .leftJoin(weterynarze, eq(entry.table.weterynarz, weterynarze.id))
                .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);
            } else if (entry.table == leczenia) {
                rows = await db
                .select({
                ...Object.fromEntries(
                    Object.keys(entry.table).filter(key => !['id', 'kon', 'weterynarz', 'choroba'].includes(key)).map(key => [key, entry.table[key]])
                ),
                Weterynarz: weterynarze.imieINazwisko,
                Choroba: choroby.opisZdarzenia
                })
                .from(entry.table)
                .leftJoin(weterynarze, eq(entry.table.weterynarz, weterynarze.id))
                .leftJoin(choroby, eq(entry.table.choroba, choroby.id))
                .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);
            } else {
                rows = await db
                .select({
                  ...Object.fromEntries(
                    Object.keys(entry.table).filter(key => !['id', 'kon', 'weterynarz'].includes(key)).map(key => [key, entry.table[key]])
                  ),
                  Weterynarz: weterynarze.imieINazwisko
                })
                .from(entry.table)
                .leftJoin(weterynarze, eq(entry.table.weterynarz, weterynarze.id))
                .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);
            }
        } else if ('kowal' in entry.table) {
            rows = await db
            .select({
                ...Object.fromEntries(
                  Object.keys(entry.table).filter(key => !['id', 'kon', 'kowal'].includes(key)).map(key => [key, entry.table[key]])
                ),
                Kowal: kowale.imieINazwisko
              })
            .from(entry.table)
            .leftJoin(kowale, eq(entry.table.kowal, kowale.id))
            .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
        } else {
            rows = await db
            .select()
            .from(entry.table)
            .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
            .then((res) => res.map(({ id, kon, ...rest }) => rest));
        }
        console.log(rows);
  
        result[event] = rows;
      }
      
  
      return c.json(result, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  });

export default raport;
