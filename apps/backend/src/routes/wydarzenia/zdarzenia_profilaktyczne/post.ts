import { db } from "@/backend/db";
import { konie, zdarzeniaProfilaktyczne } from "@/backend/db/schema";
import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "@hono/zod-openapi";
import { zdarzenieProfilaktyczneSchema } from "./schema";

export const wydarzenia_zdarzenia_profilaktyczne_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/zdarzenia_profilaktyczne",
  zValidator("json", zdarzenieProfilaktyczneSchema),
  describeRoute({
    description: "Dodaj nowe zdarzenie profilaktyczne",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(z.object({ message: z.string() })) },
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
    try {
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const {
        konieId,
        weterynarz,
        dataZdarzenia,
        rodzajZdarzenia,
        opisZdarzenia,
        dataWaznosci,
      } = c.req.valid("json");

      const konieInfo = await db
        .select({ id: konie.id, rodzajKonia: konie.rodzajKonia })
        .from(konie)
        .where(or(...konieId.map((konieId) => eq(konie.id, konieId))));

      const valuesToInsert = konieInfo.map((kon) => {
        let calculatedDate = dataWaznosci;
        if (!calculatedDate) {
          const baseDate = new Date(dataZdarzenia);

          let monthsToAdd = 0;

          if (rodzajZdarzenia === "Szczepienie") {
            monthsToAdd = kon.rodzajKonia === "Konie sportowe" ? 6 : 12;
          } else if (rodzajZdarzenia === "Dentysta") {
            monthsToAdd = ["Konie sportowe", "Konie rekreacyjne"].includes(
              kon.rodzajKonia
            )
              ? 6
              : 12;
          } else if (
            ["Podanie suplementów", "Odrobaczanie"].includes(rodzajZdarzenia)
          ) {
            monthsToAdd = 6;
          }

          baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
          calculatedDate = baseDate.toISOString().split("T")[0];
        }

        return {
          kon: kon.id,
          weterynarz,
          dataZdarzenia,
          dataWaznosci: calculatedDate,
          rodzajZdarzenia,
          opisZdarzenia,
        };
      });

      await db.insert(zdarzeniaProfilaktyczne).values(valuesToInsert);

      return c.json(
        { message: "Zdarzenie profilaktyczne dodane pomyślnie!" },
        200
      );
    } catch (error) {
      console.error(
        "Błąd podczas dodawania zdarzenia profilaktycznego:",
        error
      );
      return c.json({ error: "Błąd serwera podczas dodawania zdarzenia" }, 500);
    }
  }
);
