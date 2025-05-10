import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { choroby } from "@/backend/db/schema";

export const konie_choroby_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get("/choroby/:id{[0-9]+}", async (c) => {
  const userId = getUserFromContext(c);
  if (!userId) {
    return c.json({ error: "Błąd autoryzacji" }, 401);
  }

  const horseId = Number(c.req.param("id"));
  if (isNaN(horseId)) {
    return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
  }

  const chorobaList = await db
    .select()
    .from(choroby)
    .where(eq(choroby.kon, horseId));

  return c.json(chorobaList, 200);
});
