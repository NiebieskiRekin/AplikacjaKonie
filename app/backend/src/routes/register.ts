import { Hono } from "hono";
import bcrypt from "bcrypt";
import { users, usersInsertSchema } from "../db/schema";
import { ProcessEnv } from "../env";
import { db } from "../db";
import { basicAuth } from 'hono/basic-auth';
import { every } from 'hono/combine'
import { zValidator } from "@hono/zod-validator";

const register = new Hono()
  .use("*",
    basicAuth({
        username: 'adam',
        password: ProcessEnv.ADMIN_PASSWORD,
    }))
  .post("/", zValidator("json", usersInsertSchema),
  async (c) => {
  try {
    var user = c.req.valid("json");
    user.password = await bcrypt.hash(user.password,10);
    const [added_user] = await db.insert(users).values(user).returning();
    if (!added_user) {
      return c.json({ error: "Błąd dodawania użytkownika." }, 401);
    }

    return c.json({ added_user });
  } catch (error) {
    return c.json({ error: error }, 500);
  }
});

export default register;
