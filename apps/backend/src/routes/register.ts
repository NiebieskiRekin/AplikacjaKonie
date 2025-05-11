import { Hono } from "hono";
import bcrypt from "bcrypt";
import {
  users,
  userPermissionsInsertSchema,
  user_permissions,
  notifications,
  usersSelectSchema,
  userPermissionsSelectSchema,
} from "../db/schema";
import { db } from "../db";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { adminAuthMiddleware } from "../middleware/adminauth";
import { describeRoute } from "hono-openapi";
import { JsonMime, response_failure_schema } from "./constants";
import { resolver } from "hono-openapi/zod";

const register = new Hono()
  .use(adminAuthMiddleware)
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
    describeRoute({
      description: "Dodaj nowego użytkownika do hodowli",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(usersSelectSchema) },
          },
        },
        401: {
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
        const user = c.req.valid("json");
        user.password = await bcrypt.hash(user.password, 10);
        const [added_user] = await db.insert(users).values(user).returning();
        if (!added_user) {
          return c.json({ error: "Błąd dodawania użytkownika." }, 401);
        }

        const eventTypes = [
          "Podkucia",
          "Odrobaczanie",
          "Podanie suplementów",
          "Szczepienie",
          "Dentysta",
          "Inne",
        ];
        const eventPromises = eventTypes.map(async (eventType) => {
          await db.insert(notifications).values({
            userId: added_user.id,
            rodzajZdarzenia: eventType as
              | "Podkucia"
              | "Odrobaczanie"
              | "Podanie suplementów"
              | "Szczepienie"
              | "Dentysta"
              | "Inne",
            days: 7,
            time: "09:00",
            active: false,
            rodzajWysylania: "Oba",
          });
        });

        await Promise.all(eventPromises);

        return c.json({ added_user });
      } catch (error) {
        return c.json({ error: error }, 500);
      }
    }
  )
  .post(
    "/permission",
    zValidator("json", userPermissionsInsertSchema),
    describeRoute({
      description: "Dodaj uprawnienia do użytkownika",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(userPermissionsSelectSchema) },
          },
        },
        401: {
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
