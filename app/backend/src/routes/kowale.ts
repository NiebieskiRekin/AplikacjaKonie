import { Hono } from "hono";
import { db, eq } from "../db";
import { kowale, users } from "../db/schema";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";

const kowaleRoute = new Hono<{ Variables: { user: UserPayload } }>();

kowaleRoute.use(authMiddleware);

kowaleRoute.get("/", async (c) => {
  try {
    const user = getUserFromContext(c);
    if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

    const allKowale = await db.select().from(kowale);
    return c.json(allKowale);
  } catch (error) {
    return c.json({ error: "Błąd pobierania kowali" }, 500);
  }
});

export default kowaleRoute;
