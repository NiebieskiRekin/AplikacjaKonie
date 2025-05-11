import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq, and } from "drizzle-orm";
import {
  weterynarze,
  users,
  weterynarzeSelectSchema,
} from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";

export const weterynarze_id_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/:id{[0-9]+}",
  describeRoute({
    description:
      "Wyświetl szczegóły wskazanego weterynarza z hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(weterynarzeSelectSchema) },
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

      const weterynarz = await db
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
            eq(weterynarze.id, Number(c.req.param("id"))),
            eq(weterynarze.active, true)
          )
        )
        .then((res) => res[0]);
      return c.json(weterynarz, 200);
    } catch {
      return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
    }
  }
);
