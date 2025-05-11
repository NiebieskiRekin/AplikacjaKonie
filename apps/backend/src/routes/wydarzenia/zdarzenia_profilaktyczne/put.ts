import { db } from "@/backend/db";
import {
  zdarzeniaProfilaktyczne,
  zdarzeniaProfilaktyczneUpdateSchema,
} from "@/backend/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { UserPayload } from "@/backend/middleware/auth";
// import { describeRoute } from "hono-openapi";
// import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
// import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
import { zValidator } from "@hono/zod-validator";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_zdarzenia_profilaktyczne_put = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().put(
  "/zdarzenia_profilaktyczne/:id{[0-9]+}",
  zValidator("json", zdarzeniaProfilaktyczneUpdateSchema),
  async (c) => {
    const eventId = Number(c.req.param("id"));
    const updatedData = c.req.valid("json");

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      const updateQuery = await db
        .update(zdarzeniaProfilaktyczne)
        .set(updatedData)
        .where(eq(zdarzeniaProfilaktyczne.id, eventId))
        .returning();
      if (updateQuery.length === 0) {
        return c.json(
          { error: "Nie znaleziono wydarzenia do aktualizacji" },
          404
        );
      }

      return c.json({ success: true, updatedEvent: updateQuery[0] }, 200);
    } catch (error) {
      console.error("Błąd aktualizacji wydarzenia:", error);
      return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
    }
  }
);
