import { Hono } from "hono";
import { db } from "@/backend/db";
import { eq } from "drizzle-orm";
import { kowale, kowaleUpdateSchema } from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const kowale_id_put = new Hono<auth_vars>().put(
  "/:id{[0-9]+}",
  describeRoute({
    description: "Zmień informacje wskazanego kowala z hodowli użytkownika",
    responses: {
      201: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(kowaleUpdateSchema) },
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
  zValidator("json", kowaleUpdateSchema),
  async (c) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const { imieINazwisko, numerTelefonu } = c.req.valid("json");

      const newKowal = {
        imieINazwisko,
        numerTelefonu,
        hodowla: orgId,
      };

      const result = await db
        .update(kowale)
        .set(newKowal)
        .where(eq(kowale.id, Number(c.req.param("id"))))
        .returning();

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd dodania weterynarza" }, 500);
    }
  }
);
