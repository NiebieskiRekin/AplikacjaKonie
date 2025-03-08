import { Hono } from "hono";
import bcrypt from "bcrypt";
import {
  users,
  userPermissionsInsertSchema,
  user_permissions,
} from "../db/schema";
import { ProcessEnv } from "../env";
import { db } from "../db";
import { basicAuth } from "hono/basic-auth";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

const register = new Hono()
  .use(
    "*",
    basicAuth({
      verifyUser: async (username, password) => {
        return (
          username === "adam" &&
          (await bcrypt.compare(password, ProcessEnv.ADMIN_PASSWORD_BCRYPT))
        );
      },
    })
  )
  .post(
    "/",
    zValidator(
      "json",
      z
        .object({
          email: z.string().email(),
          password: z.string(),
          hodowla: z.number(),
        })
        .strict()
    ),
    async (c) => {
      try {
        const user = c.req.valid("json");
        user.password = await bcrypt.hash(user.password, 10);
        const [added_user] = await db.insert(users).values(user).returning();
        if (!added_user) {
          return c.json({ error: "Błąd dodawania użytkownika." }, 401);
        }

        return c.json({ added_user });
      } catch (error) {
        return c.json({ error: error }, 500);
      }
    }
  )
  .post(
    "/permission",
    zValidator("json", userPermissionsInsertSchema),
    async (c) => {
      try {
        const user_permission = c.req.valid("json");
        const [added_permission] = await db
          .insert(user_permissions)
          .values(user_permission)
          .returning();
        if (!added_permission) {
          return c.json({ error: "Błąd dodawania użytkownika." }, 401);
        }

        return c.json({ added_permission });
      } catch (error) {
        return c.json({ error: error }, 500);
      }
    }
  );

export default register;
