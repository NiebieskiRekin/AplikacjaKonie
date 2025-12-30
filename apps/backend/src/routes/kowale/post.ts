import { Hono } from "hono";
import { db } from "@/backend/db";
import {
  kowale,
  kowaleInsertSchema,
  kowaleSelectSchema,
} from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const kowale_post = new Hono<auth_vars>().post(
  "/",
  describeRoute({
    description: "Dodaj nowego kowala do hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(kowaleSelectSchema) },
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
  zValidator("json", kowaleInsertSchema),
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
        .insert(kowale)
        .values(newKowal)
        .returning()
        .then((res) => res[0]);

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd pdodania kowala" }, 500);
    }
  }
);
