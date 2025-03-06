import { Hono } from "hono";
import { db, eq } from "../db";
import { weterynarze, users } from "../db/schema";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";

const weterynarzeRoute = new Hono<{ Variables:  UserPayload }>();

weterynarzeRoute.use(authMiddleware);

weterynarzeRoute.get("/", async (c) => {
  try {
    const user = getUserFromContext(c);
    if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

    const allWeterynarze = await db.select().from(weterynarze).where(eq(weterynarze.hodowla,db.select({h:users.hodowla}).from(users).where(eq(users.id, user))));
    return c.json(allWeterynarze);
  } catch (error) {
    return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
  }
});

export default weterynarzeRoute;
