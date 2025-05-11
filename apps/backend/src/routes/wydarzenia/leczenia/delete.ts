import { db } from "@/backend/db";
import { leczenia } from "@/backend/db/schema";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { UserPayload } from "@/backend/middleware/auth";
// import { describeRoute } from "hono-openapi";
// import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
// import { resolver } from "hono-openapi/zod";
import "@hono/zod-openapi";
// import { z } from "@hono/zod-openapi";

export const wydarzenia_leczenia_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete("/leczenia/:id{[0-9]+}", async (c) => {
  const eventId = Number(c.req.param("id"));

  if (isNaN(eventId)) {
    return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
  }

  try {
    const deleteQuery = await db
      .delete(leczenia)
      .where(eq(leczenia.id, eventId))
      .returning();

    if (deleteQuery.length === 0) {
      return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
    }

    return c.json({ success: true, deletedEvent: deleteQuery[0] }, 200);
  } catch (error) {
    console.error("Błąd usuwania wydarzenia:", error);
    return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
  }
});
