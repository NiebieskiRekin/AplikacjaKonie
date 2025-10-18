import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import {
  weterynarze,
  users,
  weterynarzeSelectSchema,
  weterynarzeInsertSchema,
} from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const weterynarze_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/",
  zValidator("json", weterynarzeInsertSchema),
  describeRoute({
    description: "Dodaj weterynarza do hodowli użytkownika",
    responses: {
      201: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(weterynarzeSelectSchema) },
        },
      },
      400: {
        description: "Bład zapytania",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
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
        .insert(weterynarze)
        .values(newWeterynarz)
        .returning()
        .then((res) => res[0]);

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd dodania weterynarza" }, 500);
    }
  }
);
