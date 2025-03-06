import { Hono } from "hono";
import bcrypt from "bcrypt";
import {
  users,
  usersInsertSchema,
  userPermissionsInsertSchema,
  user_permissions,
} from "../db/schema";
import { ProcessEnv } from "../env";
import { db } from "../db";
import { basicAuth } from "hono/basic-auth";
import { zValidator } from "@hono/zod-validator";

const register = new Hono()
  .use(
    "*",
    basicAuth({
      verifyUser: async (username, password, _) => {
        return (
          username === "adam" &&
          (await bcrypt.compare(
            ProcessEnv.ADMIN_PASSWORD_BCRYPT,
            await bcrypt.hash(password, 10)
          ))
        );
      },
    })
  )
  .post("/", zValidator("json", usersInsertSchema), async (c) => {
    try {
      var user = c.req.valid("json");
      user.password = await bcrypt.hash(user.password, 10);
      const [added_user] = await db.insert(users).values(user).returning();
      if (!added_user) {
        return c.json({ error: "Błąd dodawania użytkownika." }, 401);
      }

      return c.json({ added_user });
    } catch (error) {
      return c.json({ error: error }, 500);
    }
  })
  .post(
    "/permission",
    zValidator("json", userPermissionsInsertSchema),
    async (c) => {
      try {
        var user_permission = c.req.valid("json");
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
