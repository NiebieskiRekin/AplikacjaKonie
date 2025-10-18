import { Hono } from "hono";
import { db, eq } from "@/backend/db";
import {
  hodowcyKoni,
  hodowcyKoniInsertSchema,
  hodowcyKoniSelectSchema,
} from "@/backend/db/schema";
import { adminAuthMiddleware } from "@/backend/middleware/adminauth";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

// eslint-disable-next-line drizzle/enforce-delete-with-where
export const hodowcyKoniRoute = new Hono()
  .use(adminAuthMiddleware)
  .get(
    "/",
    describeRoute({
      description: "Wyświetl hodowle koni",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(z.array(hodowcyKoniSelectSchema)) },
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
        const hodowcyKoni_result = await db.select().from(hodowcyKoni);
        return c.json(hodowcyKoni_result, 200);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  )
  .post(
    "/",
    zValidator("json", hodowcyKoniInsertSchema),
    describeRoute({
      description: "Dodaj nową hodowlę koni",
      responses: {
        201: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(hodowcyKoniSelectSchema) },
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
        const hodowca = c.req.valid("json");

        const result = await db
          .insert(hodowcyKoni)
          .values(hodowca)
          .returning()
          .then((res) => res[0]);

        return c.json(result, 201);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  )
  .get(
    "/:id{[0-9]+}",
    describeRoute({
      description: "Wyświetl szczegłówe informacje o danej hodowli koni",
      responses: {
        201: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(hodowcyKoniSelectSchema) },
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
        const id = Number.parseInt(c.req.param("id"));

        const hodowca = await db
          .select()
          .from(hodowcyKoni)
          .where(eq(hodowcyKoni.id, id))
          .then((res) => res[0]);

        if (!hodowca) {
          return c.notFound();
        }

        return c.json(hodowca);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  )
  .delete(
    "/:id{[0-9]+}",
    describeRoute({
      description: "Usuń wskazaną hodowlę koni",
      responses: {
        201: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(hodowcyKoniSelectSchema) },
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
        const id = Number.parseInt(c.req.param("id"));

        const hodowca = await db
          .delete(hodowcyKoni)
          .where(eq(hodowcyKoni.id, id))
          .returning()
          .then((res) => res[0]);

        if (!hodowca) {
          return c.notFound();
        }

        return c.json(hodowca);
      } catch {
        return c.json({ error: "Błąd serwera" }, 500);
      }
    }
  );
