import { Hono } from "hono";
import { db } from "@/backend/db";
import { and, eq } from "drizzle-orm";
import { kowale, kowaleUpdateSchema } from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { InsertKowal } from "@/backend/db/types";
import { z } from "@hono/zod-openapi";

export const kowale_id_put = new Hono<auth_vars>().put(
  "/:id{[0-9]+}",
  describeRoute({
    description: "Zmień informacje wskazanego kowala z hodowli użytkownika",
    responses: {
      201: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(kowaleUpdateSchema.omit({ hodowla: true })),
          },
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

      const newKowal: InsertKowal = {
        imieINazwisko: imieINazwisko!,
        numerTelefonu,
        hodowla: orgId,
        active: true,
      };

      const result = await db
        .update(kowale)
        .set(newKowal)
        .where(
          and(
            eq(kowale.id, Number(c.req.param("id"))),
            eq(kowale.hodowla, orgId)
          )
        )
        .returning();

      if (result.length === 0) {
        return c.json({ error: "Błąd dodania kowala" }, 500);
      }

      return c.json(result, 201);
    } catch {
      return c.json({ error: "Błąd dodania kowala" }, 500);
    }
  }
);
