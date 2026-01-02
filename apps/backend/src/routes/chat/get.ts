import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import { organization } from "@/backend/db/schema";
import { resolver } from "hono-openapi";
import { auth, auth_vars } from "@/backend/auth";
import z from "zod";

export const liczba_requestow_get = new Hono<auth_vars>().get(
  "/",
  describeRoute({
    description: "Wyświetl liczbę requestów do SI dla danej hodowli",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(z.object({ liczba_requestow: z.int() })),
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
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const result = await db
        .select({ liczba_requestow: organization.liczba_requestow })
        .from(organization)
        .where(eq(organization.id, orgId))
        .then((res) => res[0]);

      return c.json(result, 200);
    } catch {
      return c.json({ error: "Błąd pobierania liczby requestów" }, 500);
    }
  }
);
