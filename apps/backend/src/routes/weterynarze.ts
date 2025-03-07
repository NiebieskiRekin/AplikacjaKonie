import { Hono } from "hono";
import { db, eq } from "../db";
import { weterynarze, users, weterynarzeInsertSchema } from "../db/schema";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";

const weterynarzeRoute = new Hono<{ Variables: UserPayload }>();

weterynarzeRoute.use(authMiddleware);

weterynarzeRoute.get("/", async (c) => {
  try {
    const user = getUserFromContext(c);
    if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

    const allWeterynarze = await db
      .select()
      .from(weterynarze)
      .where(
        eq(
          weterynarze.hodowla,
          db.select({ h: users.hodowla }).from(users).where(eq(users.id, user))
        )
      );
    return c.json(allWeterynarze);
  } catch (error) {
    return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
  }
});

weterynarzeRoute.post("/", zValidator("json", weterynarzeInsertSchema), async (c) => {
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

    const newWeterynarz = {
      imieINazwisko,
      numerTelefonu,
      hodowla: Number(hodowla.hodowlaId),
    };

    const result = await db
      .insert(weterynarze)
      .values(newWeterynarz)
      .returning()
      .then((res) => res[0]);

    c.status(201);
    return c.json(result);
  } catch (error) {
    return c.json({ error: "Błąd dodania weterynarza" }, 500);
  }
});

export default weterynarzeRoute;
