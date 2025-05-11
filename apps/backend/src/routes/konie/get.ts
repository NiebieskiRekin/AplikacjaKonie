import { RodzajeKoni } from "@/backend/db/types";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { JsonMime, response_failure_schema } from "../constants";
import { resolver } from "hono-openapi/zod";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { users, konie, zdjeciaKoni } from "@/backend/db/schema";
import { generateV4ReadSignedUrl } from "../images";

const konieGetResponseSchemaSuccess = z.object({
  data: z.array(
    z.object({
      img_url: z
        .string()
        .url()
        .nullable()
        .openapi({
          examples: [
            "https://storage.googleapis.com/aplikacjakonie-zdjecia-koni/f5d9fa39-8306-4y2f-8a6d-c95cb086a4b5",
            "https://storage.googleapis.com/aplikacjakonie-zdjecia-koni/3f1a03dc-2de3-11f0-9f1d-00e04c6801af",
          ],
        }),
      id: z.number().openapi({ examples: [50, 102] }),
      nazwa: z.string().openapi({ examples: ["Lucky", "Gracja", "Czubajka"] }),
      numerPrzyzyciowy: z
        .string()
        .nullable()
        .openapi({ examples: ["POL007530107098", "POL0008660043801"] }),
      rodzajKonia: z.enum(RodzajeKoni),
      imageId: z.string().uuid().nullable(),
    })
  ),
});

export const konie_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/",
  describeRoute({
    description: "Wyświetl listę koni z hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(konieGetResponseSchemaSuccess) },
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
          numerPrzyzyciowy: konie.numerPrzyzyciowy,
          // numerChipa: konie.numerChipa,
          // rocznikUrodzenia: konie.rocznikUrodzenia,
          // dataPrzybyciaDoStajni:konie.dataPrzybyciaDoStajni,
          // dataOdejsciaZeStajni: konie.dataOdejsciaZeStajni,
          // hodowla:konie.hodowla,
          rodzajKonia: konie.rodzajKonia,
          // plec: konie.plec,
          imageId: zdjeciaKoni.id,
        })
        .from(user)
        .innerJoin(
          konie,
          and(eq(user.hodowla, konie.hodowla), eq(konie.active, true))
        )
        .leftJoin(
          zdjeciaKoni,
          and(eq(konie.id, zdjeciaKoni.kon), eq(zdjeciaKoni.default, true))
        )
        .orderBy(sql`LOWER(${konie.nazwa})`);

      const images_urls = await Promise.allSettled(
        horsesList.map((horse) =>
          horse.imageId ? generateV4ReadSignedUrl(horse.imageId) : null
        )
      );

      return c.json(
        {
          data: horsesList.map((k, i) => {
            return {
              ...k,
              img_url:
                images_urls[i].status === "fulfilled"
                  ? images_urls[i].value!
                  : null,
            };
          }),
        },
        200
      );
    } catch {
      return c.json({ error: "Błąd bazy danych" }, 500);
    }
  }
);
