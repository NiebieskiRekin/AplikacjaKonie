import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { users } from "../db/schema";
import { db } from "../db";
import {
  ACCESS_TOKEN,
  authMiddleware,
  getUserFromContext,
  REFRESH_TOKEN,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcrypt";
import { deleteCookie } from "hono/cookie";

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

const restartRoutes = new Hono<{ Variables: { jwtPayload:UserPayload} }>();

restartRoutes.use(authMiddleware);

restartRoutes.post("/", zValidator("json", passwordResetSchema), async (c) => {
  try {
    console.log("Otrzymano żądanie zmiany hasła");

    const user = getUserFromContext(c);
    if (!user) {
      console.log("Błąd autoryzacji");
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }

    const { oldPassword, newPassword } = c.req.valid("json");

    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user))
      .then((res) => res[0]);

    if (!dbUser) {
      console.log("Nie znaleziono użytkownika");
      return c.json({ error: "Nie znaleziono użytkownika" }, 404);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, dbUser.password);
    if (!isPasswordValid) {
      console.log("Stare hasło jest nieprawidłowe");
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

    // console.log("Hasło zostało zmienione!");
    return c.json({ message: "Hasło zostało zmienione!" });
  } catch (error) {
    console.error("Błąd podczas zmiany hasła:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: { issues: error.issues, name: "ZodError" } }, 400);
    }
    return c.json({ error: "Błąd podczas zmiany hasła" }, 500);
  }
});

export default restartRoutes;
