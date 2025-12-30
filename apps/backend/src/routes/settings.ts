import { Hono } from "hono";
import { db } from "@/backend/db";
import { notifications } from "@/backend/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  RodzajPowiadomienia,
  RodzajWysylaniaPowiadomienia,
  RodzajePowiadomien,
} from "@/backend/db/types";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "../logs/logger";
import { auth, auth_vars } from "../auth";

const common_settings = z.object({
  days: z.number().int().nonnegative(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Nieprawidłowy format czasu"),
  active: z.boolean(),
  rodzajWysylania: z.enum(["Push", "Email", "Oba"]),
});

const settings_schema = z.record(z.enum(RodzajePowiadomien), common_settings);
const LoggerScope = "Ustawienia";

const settingsRoute = new Hono<auth_vars>()
  .get(
    "/",
    describeRoute({
      description: "Wyświetl ustawienia powiadomień użytkownika",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(settings_schema) },
          },
        },
        401: {
          description: "Bład autoryzacji",
          content: {
            [JsonMime]: { schema: resolver(response_failure_schema) },
          },
        },
        500: {
          description: "Bład serwera",
          content: {
            [JsonMime]: { schema: resolver(response_failure_schema) },
          },
        },
      },
    }),
    async (c) => {
      try {
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        const userId = session?.user.id;
        const orgId = session?.session.activeOrganizationId;
        if (!userId || !orgId)
          return c.json({ error: "Błąd autoryzacji" }, 401);

        const settings = await db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, userId))
          .orderBy(asc(notifications.rodzajZdarzenia));

        type pow = RodzajWysylaniaPowiadomienia;

        const formattedSettings = settings.reduce(
          (acc, setting) => {
            acc[setting.rodzajZdarzenia] = {
              days: setting.days,
              time: setting.time.slice(0, 5),
              active: setting.active,
              rodzajWysylania: setting.rodzajWysylania,
            };
            return acc;
          },
          {} as Record<
            RodzajPowiadomienia,
            {
              days: number;
              time: string;
              active: boolean;
              rodzajWysylania: pow;
            }
          >
        );

        return c.json(formattedSettings, 200);
      } catch (error) {
        log(LoggerScope, "error", "Błąd pobierania ustawień:", error as Error);
        return c.json({ error: "Błąd pobierania ustawień" }, 500);
      }
    }
  )
  .put(
    "/",
    zValidator("json", settings_schema),
    describeRoute({
      description: "Zmień ustawienia powiadomień użytkownika",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(z.object({ message: z.string() })) },
          },
        },
        401: {
          description: "Bład autoryzacji",
          content: {
            [JsonMime]: { schema: resolver(response_failure_schema) },
          },
        },
        500: {
          description: "Bład serwera",
          content: {
            [JsonMime]: { schema: resolver(response_failure_schema) },
          },
        },
      },
    }),
    async (c) => {
      try {
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        const userId = session?.user.id;
        const orgId = session?.session.activeOrganizationId;
        if (!userId || !orgId)
          return c.json({ error: "Błąd autoryzacji" }, 401);

        const settingsObject = c.req.valid("json");

        // TODO: refactor
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
                      rodzajZdarzenia as RodzajPowiadomienia
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
                        rodzajZdarzenia as RodzajPowiadomienia
                      )
                    )
                  );
              } else {
                await db.insert(notifications).values({
                  userId,
                  rodzajZdarzenia: rodzajZdarzenia as RodzajPowiadomienia,
                  days: Number(values.days),
                  time: values.time,
                  active: Boolean(values.active),
                  rodzajWysylania: values.rodzajWysylania,
                });
              }
            }
          )
        );

        return c.json(
          {
            message: "Ustawienia zostały zaktualizowane!",
          },
          200
        );
      } catch (error) {
        log(
          LoggerScope,
          "error",
          "Błąd aktualizacji ustawień:",
          error as Error
        );
        return c.json({ error: "Błąd aktualizacji ustawień" }, 500);
      }
    }
  );

export default settingsRoute;
