import { db } from "@/backend/db";
import {
  konie,
  rozrody,
  rozrodyInsertSchema,
  rozrodySelectSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { and, eq } from "drizzle-orm";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_rozrody_post = new Hono<auth_vars>().post(
  "/rozrody",
  zValidator("json", rozrodyInsertSchema),
  describeRoute({
    description: "Dodaj wydarzenie rozrodcze",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(rozrodySelectSchema) },
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

      const _rozrody = c.req.valid("json");
      _rozrody.kon = Number(_rozrody.kon);
      _rozrody.weterynarz = Number(_rozrody.weterynarz);

      const kon = await db
        .select({ id: konie.id })
        .from(konie)
        .where(and(eq(konie.hodowla, orgId), eq(konie.id, _rozrody.kon)));

      if (kon.length === 0) {
        c.json({ error: "Nie znaleziono konia" }, 400);
      }

      const result = await db
        .insert(rozrody)
        .values(_rozrody)
        .returning()
        .then((res) => res[0]);

      return c.json(result, 200);
    } catch {
      return c.json({ error: "Błąd serwera" }, 500);
    }
  }
);
