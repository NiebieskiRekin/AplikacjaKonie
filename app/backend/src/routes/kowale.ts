import { Hono } from "hono";
import { db } from "../db";
import { kowale } from "../db/schema";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";

const kowaleRoute = new Hono<{ Variables: { user: UserPayload } }>();

kowaleRoute.use(authMiddleware);

kowaleRoute.get("/", async (c) => {
  try {
    const user = getUserFromContext(c);
    if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

    const allKowale = await db.select().from(kowale).where(eq(kowale.hodowla,db.select({h:users.hodowla}).from(users).where(eq(users.id, user.userId))));
    return c.json(allKowale);
  } catch (error) {
    return c.json({ error: "Błąd pobierania kowali" }, 500);
  }
});

export default kowaleRoute;
