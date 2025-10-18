import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import { weterynarze, users } from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

export const weterynarze_id_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete(
  "/:id{[0-9]+}",
  describeRoute({
    description:
      "Usuń informacje o wskazanym weterynarzu z hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(z.object({ success: z.string() })) },
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

      // await db
      //   .delete(weterynarze)
      //   .where(
      //     and(
      //       eq(weterynarze.id, eventId),
      //       eq(weterynarze.hodowla, Number(hodowla.hodowlaId))
      //     )
      //   )
      //   .returning();

      await db
        .update(weterynarze)
        .set({ active: false })
        .where(eq(weterynarze.id, eventId))
        .returning();

      return c.json({ success: "Weterynarz został usunięty" }, 201);
    } catch (error) {
      log(
        "Weterynarze Delete",
        "error",
        "Błąd podczas usuwania Weterynarz:",
        error as Error
      );
      return c.json(
        { error: "Błąd podczas usuwania Weterynarz", _error: error },
        500
      );
    }
  }
);
