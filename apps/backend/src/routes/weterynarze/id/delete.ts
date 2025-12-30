import { Hono } from "hono";
import { db } from "@/backend/db";
import { and, eq } from "drizzle-orm";
import { weterynarze } from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

export const weterynarze_id_delete = new Hono<auth_vars>().delete(
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const wet = await db
        .update(weterynarze)
        .set({ active: false })
        .where(and(eq(weterynarze.id, eventId), eq(weterynarze.hodowla, orgId)))
        .returning();

      if (wet.length === 0) {
        return c.json({ error: "Błąd podczas usuwania Weterynarz" }, 500);
      }

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
