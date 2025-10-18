import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import { kowale, users } from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const response_success_schema = z.object({ success: z.string() });

export const kowale_id_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete(
  "/:id{[0-9]+}",
  describeRoute({
    description: "Usuń wskazanego kowala z hodowli użytkownika",
    responses: {
      201: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(response_success_schema) },
        },
      },
      400: {
        description: "Bład autoryzacji",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
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
      //   .delete(kowale)
      //   .where(
      //     and(
      //       eq(kowale.id, eventId),
      //       eq(kowale.hodowla, Number(hodowla.hodowlaId))
      //     )
      //   )
      //   .returning();

      await db
        .update(kowale)
        .set({ active: false })
        .where(eq(kowale.id, eventId))
        .returning();

      return c.json({ success: "Kowal został usunięty" });
    } catch (error) {
      log(
        "Kowale Delete",
        "error",
        "Błąd podczas usuwania Kowal:",
        error as Error
      );
      return c.json({ error: "Błąd podczas usuwania Kowal" }, 500);
    }
  }
);
