import { Hono } from "hono";
import { db } from "@/backend/db";
import { and, eq } from "drizzle-orm";
import { kowale } from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const response_success_schema = z.object({ success: z.string() });

export const kowale_id_delete = new Hono<auth_vars>().delete(
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      await db
        .update(kowale)
        .set({ active: false })
        .where(and(eq(kowale.id, eventId), eq(kowale.hodowla, orgId)))
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
