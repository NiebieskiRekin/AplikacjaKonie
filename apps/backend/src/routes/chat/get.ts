import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import {
  hodowcyKoni,
  hodowcyKoniSelectSchema,
  users,
} from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { resolver } from "hono-openapi/zod";

export const liczba_requestow_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/",
  describeRoute({
    description: "Wyświetl liczbę requestów do SI dla danej hodowli",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(
              hodowcyKoniSelectSchema.openapi({
                description: "Liczba requestów",
              })
            ),
          },
        },
      },
      401: {
        description: "Bład autoryzacji",
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

      const hodowla = await db
        .select({ hodowlaId: users.hodowla })
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]);

      if (!hodowla) {
        return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
      }

      const result = await db
        .select({ liczba_requestow: hodowcyKoni.liczba_requestow })
        .from(hodowcyKoni)
        .where(eq(hodowcyKoni.id, hodowla.hodowlaId))
        .then((res) => res[0]);
      return c.json(result);
    } catch {
      return c.json({ error: "Błąd pobierania liczby requestów" }, 500);
    }
  }
);
