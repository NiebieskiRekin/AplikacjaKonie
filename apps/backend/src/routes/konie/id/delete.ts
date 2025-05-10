import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { konie } from "@/backend/db/schema";

export const konie_id_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete("/:id{[0-9]+}", async (c) => {
  try {
    const userId = getUserFromContext(c);
    if (!userId) {
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }

    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    const horse = await db
      .select()
      .from(konie)
      .where(eq(konie.id, horseId))
      .then((res) => res[0]);
    if (!horse) {
      return c.json({ error: "Koń nie istnieje" }, 404);
    }

    // Usuwamy konia
    await db.update(konie).set({ active: false }).where(eq(konie.id, horseId));

    return c.json({ success: "Koń został usunięty" });
  } catch (error) {
    console.error("Błąd podczas usuwania konia:", error);
    return c.json({ error: "Błąd podczas usuwania konia" }, 500);
  }
});
