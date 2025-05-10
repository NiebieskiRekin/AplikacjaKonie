import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/backend/db";
import { users, zdjeciaKoni } from "@/backend/db/schema";

export const konie_id_imageId_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete("/:id{[0-9]+}/:imageId{[A-Za-z0-9-]+}", async (c) => {
  try {
    const userId = getUserFromContext(c);
    const horseId = Number(c.req.param("id"));
    const imageId = String(c.req.param("imageId"));

    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }
    if (!imageId || imageId.trim() === "") {
      return c.json({ error: "Nieprawidłowy identyfikator zdjęcia" }, 400);
    }

    const hodowla = await db
      .select({ hodowlaId: users.hodowla })
      .from(users)
      .where(eq(users.id, userId))
      .then((res) => res[0]);

    if (!hodowla) {
      return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
    }

    const imageToDelete = await db
      .select()
      .from(zdjeciaKoni)
      .where(and(eq(zdjeciaKoni.kon, horseId), eq(zdjeciaKoni.id, imageId)))
      .then((res) => res[0]);

    if (imageToDelete.default == true) {
      const nextDefaultImage = await db
        .select()
        .from(zdjeciaKoni)
        .where(eq(zdjeciaKoni.kon, horseId))
        .orderBy(desc(zdjeciaKoni.id))
        .limit(1)
        .then((res) => res[0]);

      if (nextDefaultImage) {
        await db
          .update(zdjeciaKoni)
          .set({ default: true })
          .where(eq(zdjeciaKoni.id, nextDefaultImage.id));
      }
    }
    await db
      .delete(zdjeciaKoni)
      .where(and(eq(zdjeciaKoni.kon, horseId), eq(zdjeciaKoni.id, imageId)));

    return c.json({ message: "Usunięto zdjęcie konia" }, 200);
  } catch (error) {
    console.error("Błąd podczas usuwania zdjęcia konia:", error);
    return c.json({ error: "Błąd podczas usuwania zdjęcia konia" }, 500);
  }
});
