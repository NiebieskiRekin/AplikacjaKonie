import { db } from "@/backend/db";
import { konie, podkucia } from "@/backend/db/schema";
import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
import { podkucieSchema } from "./schema";
import { z } from "@hono/zod-openapi";

export const wydarzenia_podkucie_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/podkucie",
  zValidator("json", podkucieSchema),
  describeRoute({
    description: "Dodaj nowe podkucie",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(z.object({ message: z.string() })) },
        },
      },
      401: {
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

      const { konieId, kowal, dataZdarzenia, dataWaznosci } =
        c.req.valid("json");

      const konieInfo = await db
        .select({ id: konie.id, rodzajKonia: konie.rodzajKonia })
        .from(konie)
        .where(or(...konieId.map((konieId) => eq(konie.id, konieId))));

      // Obliczamy datę ważności na podstawie rodzaju konia
      const valuesToInsert = konieInfo.map((kon) => {
        let calculatedDate = dataWaznosci;
        if (!calculatedDate) {
          const baseDate = new Date(dataZdarzenia);

          if (
            kon.rodzajKonia === "Konie sportowe" ||
            kon.rodzajKonia === "Konie rekreacyjne"
          ) {
            baseDate.setDate(baseDate.getDate() + 42); // +6 tygodni
          } else {
            baseDate.setDate(baseDate.getDate() + 84); // +12 tygodni
          }
          calculatedDate = baseDate.toISOString().split("T")[0];
        }

        return {
          kon: kon.id,
          kowal,
          dataZdarzenia,
          dataWaznosci: calculatedDate,
        };
      });

      await db.insert(podkucia).values(valuesToInsert);

      return c.json({ message: "Podkucie dodane pomyślnie!" }, 200);
    } catch (error) {
      console.error("Błąd podczas dodawania podkucia:", error);
      return c.json({ error: "Błąd serwera podczas dodawania podkucia" }, 500);
    }
  }
);
