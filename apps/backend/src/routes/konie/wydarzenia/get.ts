import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq, isNull, and, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { users, konie } from "@/backend/db/schema";
import { describeRoute } from "hono-openapi";
import { JsonMime } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
// import { z } from "@hono/zod-openapi";
import { RodzajeKoni } from "@/backend/db/types";
import "zod-openapi/extend";
import { z } from "zod";

const konie_wydarzenia_get_response_success = z.array(
  z.object({
    id: z.number(),
    nazwa: z.string(),
    rodzajKonia: z.enum(RodzajeKoni),
  })
);

const konie_wydarzenia_get_response_error = z
  .object({ error: z.string() })
  .openapi({ example: { error: "Błąd zapytania" } });

export const konie_wydarzenia_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/wydarzenia",
  describeRoute({
    description: "Wyświetl listę koni ponownie???",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(konie_wydarzenia_get_response_success),
          },
        },
      },
      500: {
        desciption: "Błąd serwera",
        content: {
          [JsonMime]: {
            schema: resolver(konie_wydarzenia_get_response_error),
          },
        },
      },
    },
  }),
  async (c) => {
    const userId = getUserFromContext(c);

    try {
      const user = db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .as("user_hodowla");

      // Pobieramy konie tylko tej samej hodowli

      const horsesList = await db
        .select({
          id: konie.id,
          nazwa: konie.nazwa,
          // numerPrzyzyciowy: konie.numerPrzyzyciowy,
          // numerChipa: konie.numerChipa,
          // rocznikUrodzenia: konie.rocznikUrodzenia,
          // dataPrzybyciaDoStajni:konie.dataPrzybyciaDoStajni,
          // dataOdejsciaZeStajni: konie.dataOdejsciaZeStajni,
          // hodowla:konie.hodowla,
          rodzajKonia: konie.rodzajKonia,
          // plec: konie.plec,
        })
        .from(user)
        .innerJoin(
          konie,
          and(
            eq(user.hodowla, konie.hodowla),
            eq(konie.active, true),
            isNull(konie.dataOdejsciaZeStajni)
          )
        )
        .orderBy(sql`LOWER(${konie.nazwa})`);

      return c.json(
        horsesList.map((k) => {
          return { ...k };
        })
      );
    } catch {
      return c.json({ error: "Błąd zapytania" }, 500);
    }
  }
);
