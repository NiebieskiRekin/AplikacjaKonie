import { Hono } from "hono";
import { db } from "@/backend/db";
import { and, eq, sql } from "drizzle-orm";
import { member, organization } from "@/backend/db/schema";
import { auth, auth_vars } from "@/backend/auth";

// TODO: Add schema
// TODO: pobieranie liczby wolnych requestów z serwera, aby walidować po stronie klienta nie ma sensu
export const liczba_requestow_decrease = new Hono<auth_vars>().post(
  "/decrease",
  async (c) => {
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      const userId = session?.user.id;
      if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

      // eslint-disable-next-line drizzle/enforce-update-with-where
      await db
        .update(organization)
        .set({
          liczba_requestow: sql`${organization.liczba_requestow} - 1`,
        })
        .from(member)
        .where(
          and(
            eq(member.userId, userId),
            eq(organization.id, member.organizationId)
          )
        );

      return c.json({ status: "OK" });
    } catch {
      return c.json({ error: "Błąd aktualizacji liczby requestów" }, 500);
    }
  }
);
