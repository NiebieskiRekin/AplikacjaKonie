import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq, isNull, and, sql } from "drizzle-orm";
import { db } from "../../../db";
import { users, konie } from "@/backend/db/schema";

export const konie_wydarzenia_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get("/wydarzenia", async (c) => {
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
    return c.json({ error: "Błąd zapytania" });
  }
});
