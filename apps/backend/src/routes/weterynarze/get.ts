import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq, and } from "drizzle-orm";
import { weterynarze, weterynarzeSelectSchema } from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

export const weterynarze_get = new Hono<auth_vars>().get(
  "/",
  describeRoute({
    description: "Wyświetl weterynarzy z hodowli użytkownika",
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const allWeterynarze = await db
        .select()
        .from(weterynarze)
        .where(
          and(eq(weterynarze.hodowla, orgId), eq(weterynarze.active, true))
        );
      return c.json(allWeterynarze, 200);
    } catch {
      return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
    }
  }
);
