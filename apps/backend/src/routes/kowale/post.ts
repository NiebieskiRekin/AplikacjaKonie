import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import {
  kowale,
  kowaleInsertSchema,
  kowaleSelectSchema,
  users,
} from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const kowale_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/",
  describeRoute({
    description: "Dodaj nowego kowala do hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(kowaleSelectSchema) },
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
  zValidator("json", kowaleInsertSchema),
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
  }
);
