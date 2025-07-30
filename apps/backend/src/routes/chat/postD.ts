import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq, sql } from "drizzle-orm";
import { hodowcyKoni, users } from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";

export const liczba_requestow_decrease = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post("/decrease", async (c) => {
  try {
    const userId = getUserFromContext(c);
    if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

    const hodowla = await db
      .select({ hodowlaId: users.hodowla })
      .from(users)
      .where(eq(users.id, userId))
      .then((res) => res[0]);

    if (!hodowla) {
      return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
    }

    await db
      .update(hodowcyKoni)
      .set({
        liczba_requestow: sql`${hodowcyKoni.liczba_requestow} - 1`,
      })
      .where(eq(hodowcyKoni.id, hodowla.hodowlaId));

    return c.json({ status: "OK" });
  } catch {
    return c.json({ error: "Błąd aktualizacji liczby requestów" }, 500);
  }
});
