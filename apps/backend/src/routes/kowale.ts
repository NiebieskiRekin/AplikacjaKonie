import { Hono } from "hono";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { kowale, users, kowaleInsertSchema } from "../db/schema";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";

const kowaleRoute =new Hono<{ Variables: { jwtPayload:UserPayload} }>();

kowaleRoute.use(authMiddleware);

kowaleRoute.get("/", async (c) => {
  try {
    const user = getUserFromContext(c);
    if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

    const allKowale = await db
      .select()
      .from(kowale)
      .where(
        eq(
          kowale.hodowla,
          db.select({ h: users.hodowla }).from(users).where(eq(users.id, user))
        )
      );
    return c.json(allKowale);
  } catch {
    return c.json({ error: "Błąd pobierania kowali" }, 500);
  }
});

kowaleRoute.get("/:id{[0-9]+}", async (c) => {
  try {
    const user = getUserFromContext(c);
    if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

    const weterynarz = await db
      .select()
      .from(kowale)
      .where(
        and(
          eq(
            kowale.hodowla,
            db.select({ h: users.hodowla }).from(users).where(eq(users.id, user))
          ),
          eq(kowale.id, Number(c.req.param("id")))
        )
      )
      .then((res) => res[0]);
    return c.json(weterynarz);
  } catch (error) {
    return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
  }
});

kowaleRoute.post("/", zValidator("json", kowaleInsertSchema), async (c) => {
  try {
    const userId = getUserFromContext(c);
    if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);
    const { imieINazwisko, numerTelefonu } = c.req.valid("json");

    const hodowla = await db
      .select({ hodowlaId: users.hodowla })
      .from(users)
      .where(eq(users.id, userId))
      .then((res) => res[0]);

    if (!hodowla) {
      return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
    }

    const newKowal = {
      imieINazwisko,
      numerTelefonu,
      hodowla: Number(hodowla.hodowlaId),
    };

    const result = await db
      .insert(kowale)
      .values(newKowal)
      .returning()
      .then((res) => res[0]);

    c.status(201);
    return c.json(result);
  } catch {
    return c.json({ error: "Błąd pdodania kowala" }, 500);
  }
});

kowaleRoute.put("/:id{[0-9]+}", zValidator("json", kowaleInsertSchema), async (c) => {
  try {
    const userId = getUserFromContext(c);
    if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);
    const { imieINazwisko, numerTelefonu } = c.req.valid("json");

    const hodowla = await db
      .select({ hodowlaId: users.hodowla })
      .from(users)
      .where(eq(users.id, userId))
      .then((res) => res[0]);

    if (!hodowla) {
      return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
    }

    const newKowal = {
      imieINazwisko,
      numerTelefonu,
      hodowla: Number(hodowla.hodowlaId),
    };

    const result = await db
      .update(kowale)
      .set(newKowal)
      .where(eq(kowale.id, Number(c.req.param("id"))))
      .returning()

    c.status(201);
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Błąd dodania weterynarza" }, 500);
  }
});


kowaleRoute.delete("/:id{[0-9]+}", async (c) => {
  try {
    const eventId = Number(c.req.param("id"));
    const userId = getUserFromContext(c);

    if (!userId) {
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }

    const hodowla = await db
    .select({ hodowlaId: users.hodowla })
    .from(users)
    .where(eq(users.id, userId))
    .then((res) => res[0]);

    if (!hodowla) {
      return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
    }

    await db.delete(kowale)
    .where(and(
      eq(kowale.id, eventId),
      eq(kowale.hodowla, Number(hodowla.hodowlaId))
    )).returning();

    return c.json({ success: "Koń został usunięty" });
  } catch (error) {
    console.error("Błąd podczas usuwania konia:", error);
    return c.json({ error: "Błąd podczas usuwania konia" }, 500);
  }
});

export default kowaleRoute;
