import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { choroby, chorobySelectSchema } from "@/backend/db/schema";

import { describeRoute } from "hono-openapi";
import { JsonMime } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";
import "@hono/zod-openapi";

const konie_choroby_get_response_error = z
  .object({ error: z.string() })
  .openapi({ example: { error: "Błąd zapytania" } });

export const konie_choroby_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get(
  "/choroby/:id{[0-9]+}",
  describeRoute({
    description: "Wyświetl informacje o chorobach danego konia",
    responses: {
      200: {
        // ContentfulStatusCode
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(z.array(chorobySelectSchema)),
          },
        },
      },
      400: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(konie_choroby_get_response_error),
          },
        },
      },
      401: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(konie_choroby_get_response_error),
          },
        },
      },
    },
  }),
  async (c) => {
    const userId = getUserFromContext(c);
    if (!userId) {
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }

    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    const chorobaList = await db
      .select()
      .from(choroby)
      .where(eq(choroby.kon, horseId));

    return c.json(chorobaList, 200);
  }
);
