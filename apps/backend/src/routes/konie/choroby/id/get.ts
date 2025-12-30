import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/backend/db";
import { choroby, chorobySelectSchema, konie } from "@/backend/db/schema";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

export const konie_choroby_get = new Hono<auth_vars>().get(
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
            schema: resolver(response_failure_schema),
          },
        },
      },
      401: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
    },
  }),
  async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    const userId = session?.user.id;
    const orgId = session?.session.activeOrganizationId;
    if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    const chorobaList = await db
      .select({
        id: choroby.id,
        kon: choroby.kon,
        dataRozpoczecia: choroby.dataRozpoczecia,
        dataZakonczenia: choroby.dataZakonczenia,
        opisZdarzenia: choroby.opisZdarzenia,
      })
      .from(choroby)
      .innerJoin(konie, eq(konie.id, choroby.kon))
      .where(and(eq(choroby.kon, horseId), eq(konie.hodowla, orgId)));

    return c.json(chorobaList, 200);
  }
);
