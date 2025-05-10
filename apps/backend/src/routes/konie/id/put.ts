import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { konie, konieUpdateSchema } from "@/backend/db/schema";
import { zValidator } from "@hono/zod-validator";

export const konie_id_put = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().put(
  "/:id{[0-9]+}",
  zValidator(
    "json",
    konieUpdateSchema.omit({
      id: true,
      hodowla: true,
      active: true,
    })
  ),
  async (c) => {
    const userId = getUserFromContext(c);
    if (!userId) {
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }

    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    try {
      const d = c.req.valid("json");

      const dataPrzybycia =
        d.dataPrzybyciaDoStajni === "" ? null : d.dataPrzybyciaDoStajni;
      const dataOdejscia =
        d.dataOdejsciaZeStajni === "" ? null : d.dataOdejsciaZeStajni;

      const updatedHorse = await db
        .update(konie)
        .set({
          nazwa: d.nazwa,
          numerPrzyzyciowy: d.numerPrzyzyciowy,
          numerChipa: d.numerChipa,
          rocznikUrodzenia: d.rocznikUrodzenia,
          dataPrzybyciaDoStajni: dataPrzybycia,
          dataOdejsciaZeStajni: dataOdejscia,
          rodzajKonia: d.rodzajKonia,
          plec: d.plec,
        })
        .where(eq(konie.id, horseId))
        .returning();

      if (!updatedHorse) {
        return c.json(
          { error: "Nie udało się zaktualizować danych konia" },
          500
        );
      }

      return c.json({
        success: "Dane konia zostały zaktualizowane",
        horse: updatedHorse,
      });
    } catch (error) {
      console.error("Błąd aktualizacji konia:", error);
      return c.json({ error: "Błąd aktualizacji konia" }, 500);
    }
  }
);
