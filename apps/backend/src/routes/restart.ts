import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { users } from "@/backend/db/schema";
import { db } from "@/backend/db";
import {
  ACCESS_TOKEN,
  authMiddleware,
  getUserFromContext,
  REFRESH_TOKEN,
  UserPayload,
} from "@/backend/middleware/auth";
import bcrypt from "bcrypt";
import { deleteCookie } from "hono/cookie";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "../logs/logger";

const passwordResetSchema = z
  .object({
    oldPassword: z.string().min(2, "Stare hasło jest wymagane"),
    newPassword: z.string().min(6, "Nowe hasło musi mieć min. 6 znaków"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Nowe hasła muszą się zgadzać!",
    path: ["confirmNewPassword"],
  });

const LoggerScope = "Password Reset";

const restartRoutes = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .post(
    "/",
    zValidator("json", passwordResetSchema),
    describeRoute({
      description: "Zmień hasło użytkownika",
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
        404: {
          description: "Bład zapytania",
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
        const user = getUserFromContext(c);
        if (!user) {
          log(LoggerScope, "info", "Błąd autoryzacji");
          return c.json({ error: "Błąd autoryzacji" }, 401);
        }

        log(LoggerScope, "info", "Otrzymano żądanie zmiany hasła od " + user);

        const { oldPassword, newPassword } = c.req.valid("json");

        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.id, user))
          .then((res) => res[0]);

        if (!dbUser) {
          log(LoggerScope, "info", "Nie znaleziono użytkownika " + user);
          return c.json({ error: "Nie znaleziono użytkownika" }, 404);
        }

        const isPasswordValid = await bcrypt.compare(
          oldPassword,
          dbUser.password
        );
        if (!isPasswordValid) {
          log(LoggerScope, "info", "Stare hasło jest nieprawidłowe");
          return c.json({ error: "Stare hasło jest nieprawidłowe" }, 401);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db
          .update(users)
          .set({
            password: hashedPassword,
            refreshTokenVersion: sql`refresh_token_version+1`,
          })
          .where(eq(users.id, user));

        deleteCookie(c, ACCESS_TOKEN);
        deleteCookie(c, REFRESH_TOKEN);

        // const tokens = await createAuthTokens({...dbUser, refreshTokenVersion: version.at(0)?.refreshTokenVersion!})
        // setCookie(c,ACCESS_TOKEN,tokens.accessToken,access_cookie_opts);
        // setCookie(c,REFRESH_TOKEN,tokens.refreshToken,refresh_cookie_opts);

        log(LoggerScope, "info", "Hasło zostało zmienione");
        return c.json({ message: "Hasło zostało zmienione!" }, 200);
      } catch (error) {
        log(LoggerScope, "info", "Błąd podczas zmiany hasła", error as Error);
        if (error instanceof z.ZodError) {
          return c.json(
            { error: { issues: error.issues, name: "ZodError" } },
            400
          );
        }
        return c.json({ error: "Błąd podczas zmiany hasła" }, 500);
      }
    }
  );

export default restartRoutes;
