import { Hono } from "hono";
import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
import { sign } from "hono/jwt";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { ProcessEnv } from "../env";
import { db } from "../db";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { access_cookie_opts, ACCESS_TOKEN, createAuthTokens, refresh_cookie_opts, REFRESH_TOKEN, UserPayload } from "../middleware/auth";
import { setCookie } from "hono/cookie";


const login = new Hono().post("/", zValidator(
  'json',
  z.object({
    email: z.string({"message":"Email jest wymagany"}).email({"message":"Niepoprawny format adresu email"}),
    password: z.string({"message":"Hasło jest wymagane"})
  })
  ), async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email i hasło są wymagane." }, 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      return c.json({ error: "Nieprawidłowe dane logowania." }, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return c.json({ error: "Nieprawidłowe hasło." }, 401);
    }

    const tokens = await createAuthTokens(user);

    setCookie(c,ACCESS_TOKEN,tokens.accessToken,access_cookie_opts);
    setCookie(c,REFRESH_TOKEN,tokens.refreshToken,refresh_cookie_opts);

    return c.json({ status: "Logowanie poprawne" });
  } catch (error) {
    console.log(error);
    return c.json({ error: "Błąd podczas logowania" }, 500);
  }
});

export default login;
