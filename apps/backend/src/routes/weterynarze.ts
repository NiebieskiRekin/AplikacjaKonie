import { Hono } from "hono";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { weterynarze, users, weterynarzeInsertSchema } from "../db/schema";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";

// eslint-disable-next-line drizzle/enforce-delete-with-where
const weterynarzeRoute = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .get("/", async (c) => {
    try {
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const allWeterynarze = await db
        .select()
        .from(weterynarze)
        .where(
          eq(
            weterynarze.hodowla,
            db
              .select({ h: users.hodowla })
              .from(users)
              .where(eq(users.id, user))
          )
        );
      return c.json(allWeterynarze, 200);
    } catch {
      return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
    }
  })
  .get("/:id{[0-9]+}", async (c) => {
    try {
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const weterynarz = await db
        .select()
        .from(weterynarze)
        .where(
          and(
            eq(
              weterynarze.hodowla,
              db
                .select({ h: users.hodowla })
                .from(users)
                .where(eq(users.id, user))
            ),
            eq(weterynarze.id, Number(c.req.param("id")))
          )
        )
        .then((res) => res[0]);
      return c.json(weterynarz, 200);
    } catch {
      return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
    }
  })
  .post("/", zValidator("json", weterynarzeInsertSchema), async (c) => {
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

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd dodania weterynarza" }, 500);
    }
  })
  .put(
    "/:id{[0-9]+}",
    zValidator("json", weterynarzeInsertSchema),
    async (c) => {
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
          return c.json(
            { error: "Nie znaleziono hodowli dla użytkownika" },
            400
          );
        }

        const newWeterynarz = {
          imieINazwisko,
          numerTelefonu,
          hodowla: Number(hodowla.hodowlaId),
        };

        const result = await db
          .update(weterynarze)
          .set(newWeterynarz)
          .where(eq(weterynarze.id, Number(c.req.param("id"))))
          .returning();

        return c.json(result, 201);
      } catch {
        return c.json({ error: "Błąd dodania weterynarza" }, 500);
      }
    }
  )
  .delete("/:id{[0-9]+}", async (c) => {
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

      await db
        .delete(weterynarze)
        .where(
          and(
            eq(weterynarze.id, eventId),
            eq(weterynarze.hodowla, Number(hodowla.hodowlaId))
          )
        )
        .returning();

      return c.json({ success: "Koń został usunięty" }, 201);
    } catch (error) {
      console.error("Błąd podczas usuwania konia:", error);
      return c.json({ error: "Błąd podczas usuwania konia" }, 500);
    }
  });

export default weterynarzeRoute;
