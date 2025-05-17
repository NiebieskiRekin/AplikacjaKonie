import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq, and } from "drizzle-orm";
import { kowale, kowaleSelectSchema, users } from "@/backend/db/schema";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const kowale_id_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/:id{[0-9]+}",
  describeRoute({
    description: "Wyświetl szczegóły wskazanego kowala z hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(
              kowaleSelectSchema.openapi({
                description: "Szczegóły wskazanego kowala",
                example: {
                  id: 1,
                  imieINazwisko: "Jan Kowalski",
                  numerTelefonu: "831321432",
                  hodowla: 5,
                  active: true,
                },
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
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const result = await db
        .select()
        .from(kowale)
        .where(
          and(
            eq(
              kowale.hodowla,
              db
                .select({ h: users.hodowla })
                .from(users)
                .where(eq(users.id, user))
            ),
            eq(kowale.id, Number(c.req.param("id"))),
            eq(kowale.active, true)
          )
        )
        .then((res) => res[0]);
      return c.json(result);
    } catch {
      return c.json({ error: "Błąd pobierania kowali" }, 500);
    }
  }
);
