import { Hono } from "hono";
import { db } from "@/backend/db";
import {
  weterynarze,
  weterynarzeSelectSchema,
  weterynarzeInsertSchema,
} from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
// import { z } from "@hono/zod-openapi";

export const weterynarze_post = new Hono<auth_vars>().post(
  "/",
  zValidator("json", weterynarzeInsertSchema),
  describeRoute({
    description: "Dodaj weterynarza do hodowli użytkownika",
    responses: {
      201: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(weterynarzeSelectSchema) },
        },
      },
      400: {
        description: "Bład zapytania",
        content: {
          [JsonMime]: { schema: resolver(response_failure_schema) },
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

      const { imieINazwisko, numerTelefonu } = c.req.valid("json");

      const newWeterynarz = {
        imieINazwisko,
        numerTelefonu,
        hodowla: orgId,
      };

      const result = await db
        .insert(weterynarze)
        .values(newWeterynarz)
        .returning()
        .then((res) => res[0]);

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd dodania weterynarza" }, 500);
    }
  }
);
