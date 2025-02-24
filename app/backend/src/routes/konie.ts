import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { konie, users } from "../db/schema";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";

// ✅ Definicja kontekstu z użytkownikiem
const horses = new Hono<{ Variables: { user: UserPayload } }>();

// ✅ Użycie autoryzacji
horses.use(authMiddleware);

// ✅ Pobieranie koni tylko dla użytkownika
horses.get("/", async (c) => {
  const user = getUserFromContext(c);

  if (!user) {
    return c.json({ error: "Błąd autoryzacji" }, 401);
  }

  console.log(`🔍 Pobieranie koni dla użytkownika: ${user.email}`);

  const hodowla = await db
    .select()
    .from(users)
    .where(eq(users.id, user.userId))
    .then((res) => res[0]);
  // Pobieramy konie tylko tej samej hodowli
  const horsesList = await db
    .select()
    .from(konie)
    .where(eq(konie.hodowla, hodowla.hodowla));

  console.log("🐴 Lista koni:", horsesList);

  return c.json(horsesList);
});

export default horses;
