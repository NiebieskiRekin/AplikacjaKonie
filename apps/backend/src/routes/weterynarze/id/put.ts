import { Hono } from "hono";
import { db } from "@/backend/db";
import { and, eq } from "drizzle-orm";
import {
  weterynarze,
  weterynarzeInsertSchema,
  weterynarzeSelectSchema,
} from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { InsertWeterynarz } from "@/backend/db/types";

export const weterynarze_id_put = new Hono<auth_vars>().put(
  "/:id{[0-9]+}",
  zValidator("json", weterynarzeInsertSchema),
  describeRoute({
    description: "Zaktualizuj informacje o weterynarzu z hodowli użytkownika",
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

      const { imieINazwisko, numerTelefonu } = c.req.valid("json");

      const newWeterynarz: InsertWeterynarz = {
        imieINazwisko,
        numerTelefonu,
        hodowla: orgId,
        active: true,
      };
      const wetId = Number(c.req.param("id"));

      const result = await db
        .update(weterynarze)
        .set(newWeterynarz)
        .where(and(eq(weterynarze.id, wetId), eq(weterynarze.hodowla, orgId)))
        .returning();

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd dodania weterynarza" }, 500);
    }
  }
);
