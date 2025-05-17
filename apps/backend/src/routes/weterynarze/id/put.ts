import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import {
  weterynarze,
  users,
  weterynarzeInsertSchema,
  weterynarzeSelectSchema,
} from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

export const weterynarze_id_put = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().put(
  "/:id{[0-9]+}",
  zValidator("json", weterynarzeInsertSchema),
  describeRoute({
    description: "Zaktualizuj informacje o weterynarzu z hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(z.array(weterynarzeSelectSchema)) },
        },
      },
      401: {
        description: "Bład serwera",
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
        .update(weterynarze)
        .set(newWeterynarz)
        .where(eq(weterynarze.id, Number(c.req.param("id"))))
        .returning();

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd dodania weterynarza" }, 500);
    }
  }
);
