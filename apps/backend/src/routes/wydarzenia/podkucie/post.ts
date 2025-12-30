import { db } from "@/backend/db";
import { konie, podkucia } from "@/backend/db/schema";
import { Hono } from "hono";
import { eq, inArray, and } from "drizzle-orm";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { podkucieSchema } from "./schema";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

export const wydarzenia_podkucie_post = new Hono<auth_vars>().post(
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const { konieId, kowal, dataZdarzenia, dataWaznosci } =
        c.req.valid("json");

      const konieInfo = await db
        .select({ id: konie.id, rodzajKonia: konie.rodzajKonia })
        .from(konie)
        .where(and(inArray(konie.id, konieId), eq(konie.hodowla, orgId)));

      if (konieInfo.length === 0) {
        return c.json({ error: "Błąd przy wyborze koni do podkucia" }, 400);
      }

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
      log(
        "Podkucie Post",
        "error",
        "Błąd podczas dodawania podkucia:",
        error as Error
      );
      return c.json({ error: "Błąd serwera podczas dodawania podkucia" }, 500);
    }
  }
);
