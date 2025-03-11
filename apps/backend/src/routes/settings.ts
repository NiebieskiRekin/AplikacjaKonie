import { Hono } from "hono";
import { db, eq } from "../db";
import { notifications, notificationsSelectSchema } from "../db/schema";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";

const settingsRoute = new Hono<{ Variables: UserPayload }>();

settingsRoute.use(authMiddleware);

// settingsRoute.get("/", async (c) => {
//   try {
//     const user = getUserFromContext(c);
//     if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

//     const allWeterynarze = await db
//       .select()
//       .from(weterynarze)
//       .where(
//         eq(
//           weterynarze.hodowla,
//           db.select({ h: users.hodowla }).from(users).where(eq(users.id, user))
//         )
//       );
//     return c.json(allWeterynarze);
//   } catch (error) {
//     return c.json({ error: "Błąd pobierania weterynarzy" }, 500);
//   }
// });


settingsRoute.post("/", zValidator("json", notificationsSelectSchema), async (c) => {
  try {
    const userId = getUserFromContext(c);
    if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

    const settingsData = c.req.valid("json"); // Pobiera dane z requesta

    const existingSettings = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .then((res) => res[0]);

    let result;
    
    if (existingSettings) {
      result = await db
        .update(notifications)
        .set(settingsData)
        .where(eq(notifications.userId, userId))
        .returning()
        .then((res) => res[0]);
    } else {
      result = await db
        .insert(notifications)
        .values({ ...settingsData, userId })
        .returning()
        .then((res) => res[0]);
    }

    return c.json({ success: true, settings: result }, 201);
  } catch (error) {
    console.error("Błąd zapisywania ustawień:", error);
    return c.json({ error: "Błąd zapisywania ustawień" }, 500);
  }
});


export default settingsRoute;
