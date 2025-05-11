import { Hono } from "hono";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import { weterynarze, users, weterynarzeSelectSchema } from "../../db/schema";
import { getUserFromContext, UserPayload } from "../../middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";

export const weterynarze_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
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
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const allWeterynarze = await db
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
            eq(weterynarze.active, true)
          )
        );
      return c.json(allWeterynarze, 200);
    } catch {
      return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
    }
  }
);
