import { Hono } from "hono";
import { db } from "../db";
import { notifications } from "../db/schema";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const common_settings = z.object({
  days: z.number().int().nonnegative(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Nieprawidłowy format czasu"),
  active: z.boolean(),
  rodzajWysylania: z.enum(["Push", "Email", "Oba", "Żadne"]),
});

export const notificationsInsertSchema = z.object({
  Podkucia: common_settings,
  Odrobaczanie: common_settings,
  "Podanie suplementów": common_settings,
  Szczepienie: common_settings,
  Dentysta: common_settings,
  Inne: common_settings,
});

const settingsRoute = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .get("/", async (c) => {
    try {
      const userId = getUserFromContext(c);
      if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const settings = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(asc(notifications.rodzajZdarzenia));

      const formattedSettings = settings.reduce(
        (acc, setting) => {
          acc[setting.rodzajZdarzenia] = {
            days: setting.days,
            time: setting.time.slice(0, 5),
            active: setting.active,
            notify: setting.rodzajWysylania,
          };
          return acc;
        },
        {} as Record<
          string,
          { days: number; time: string; active: boolean; notify: string }
        >
      );

      return c.json(formattedSettings);
    } catch (error) {
      console.error("Błąd pobierania ustawień:", error);
      return c.json({ error: "Błąd pobierania ustawień" }, 500);
    }
  })
  .put("/", zValidator("json", notificationsInsertSchema), async (c) => {
    try {
      const userId = getUserFromContext(c);
      if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const settingsObject = c.req.valid("json");

      await Promise.all(
        Object.entries(settingsObject).map(
          async ([rodzajZdarzenia, values]) => {
            const existingSetting = await db
              .select()
              .from(notifications)
              .where(
                and(
                  eq(notifications.userId, userId),
                  eq(
                    notifications.rodzajZdarzenia,
                    rodzajZdarzenia as
                      | "Podkucia"
                      | "Odrobaczanie"
                      | "Podanie suplementów"
                      | "Szczepienie"
                      | "Dentysta"
                      | "Inne"
                  )
                )
              )
              .then((res) => res[0]);

            if (existingSetting) {
              await db
                .update(notifications)
                .set({
                  days: Number(values.days),
                  time: values.time,
                  active: Boolean(values.active),
                  rodzajWysylania: values.rodzajWysylania,
                })
                .where(
                  and(
                    eq(notifications.userId, userId),
                    eq(
                      notifications.rodzajZdarzenia,
                      rodzajZdarzenia as
                        | "Podkucia"
                        | "Odrobaczanie"
                        | "Podanie suplementów"
                        | "Szczepienie"
                        | "Dentysta"
                        | "Inne"
                    )
                  )
                );
            } else {
              await db.insert(notifications).values({
                userId,
                rodzajZdarzenia: rodzajZdarzenia as
                  | "Podkucia"
                  | "Odrobaczanie"
                  | "Podanie suplementów"
                  | "Szczepienie"
                  | "Dentysta"
                  | "Inne",
                days: Number(values.days),
                time: values.time,
                active: Boolean(values.active),
                rodzajWysylania: values.rodzajWysylania,
              });
            }
          }
        )
      );

      return c.json({
        success: true,
        message: "Ustawienia zostały zaktualizowane!",
      });
    } catch (error) {
      console.error("Błąd aktualizacji ustawień:", error);
      return c.json({ error: "Błąd aktualizacji ustawień" }, 500);
    }
  });

export default settingsRoute;
