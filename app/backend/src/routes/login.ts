import { Hono } from "hono";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { ProcessEnv } from "../env";
import { db } from "../db";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'


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

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      ProcessEnv.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return c.json({ token });
  } catch (error) {
    return c.json({ error: "Błąd podczas logowania" }, 500);
  }
});

export default login;
