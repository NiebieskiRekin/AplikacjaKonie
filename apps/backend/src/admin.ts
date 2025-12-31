import { Hono } from "hono";
import {
  hodowcyKoniSelectSchema,
  notifications,
  usersSelectSchema,
} from "@/backend/db/schema";
import { db } from "@/backend/db";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { auth, auth_vars } from "./auth";
import { log } from "./logs/logger";

const userSchema = usersSelectSchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
  banExpires: z.string().nullable(),
});

const orgSchema = hodowcyKoniSelectSchema.extend({
  createdAt: z.string(),
});

const admin = new Hono<auth_vars>()
  .post(
    "/user",
    zValidator(
      "json",
      z
        .object({
          email: z.email(),
          password: z.string().nonempty(),
          organizationId: z.string().nonempty(),
          name: z.string().nonempty(),
        })
        .strict()
    ),
    describeRoute({
      description: "Dodaj nowego użytkownika do hodowli",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(userSchema) },
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
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        const userId = session?.user.id;
        if (!userId || session?.user.role != "admin")
          return c.json({ error: "Błąd autoryzacji" }, 401);

        const userParams = c.req.valid("json");

        const newUser = await auth.api.createUser({
          body: {
            email: userParams.email,
            password: userParams.password,
            name: userParams.name,
            role: "user",
          },
          headers: c.req.raw.headers,
        });

        await auth.api.addMember({
          body: {
            role: "member",
            userId: newUser.user.id,
            organizationId: userParams.organizationId,
          },
          headers: c.req.raw.headers,
        });

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
            userId: newUser.user.id,
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

        return c.json(newUser.user, 200);
      } catch (error) {
        return c.json({ error: error }, 500);
      }
    }
  )
  .post(
    "/organization",
    zValidator(
      "json",
      z
        .object({
          name: z.string().nonempty(),
          slug: z.string().nonempty(),
        })
        .strict()
    ),
    describeRoute({
      description: "Dodaj nową hodowlę",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: { schema: resolver(orgSchema) },
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
        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        const userId = session?.user.id;
        if (!userId || session?.user.role != "admin")
          return c.json({ error: "Błąd autoryzacji" }, 401);

        const orgParams = c.req.valid("json");

        const newOrg = await auth.api.createOrganization({
          body: {
            name: orgParams.name,
            slug: orgParams.slug,
            keepCurrentActiveOrganization: true,
          },
          headers: c.req.raw.headers,
        });

        return c.json(newOrg, 200);
      } catch (error) {
        return c.json({ error: error }, 500);
      }
    }
  )
  .get(
    "/organization",
    zValidator(
      "query",
      z
        .object({
          limit: z.coerce.number().int().positive(),
          offset: z.coerce.number().int().nonnegative(),
        })
        .strict()
    ),
    describeRoute({
      description: "Wypisz hodowle",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: {
              schema: resolver(z.object({ organizations: z.array(orgSchema) })),
            },
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
        const { limit, offset } = c.req.valid("query");

        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        const userId = session?.user.id;
        if (!userId || session?.user.role != "admin")
          return c.json({ error: "Błąd autoryzacji" }, 401);

        const orgs = await auth.api.listOrganizations({
          query: {
            limit: limit,
            offset: offset,
          },
          headers: c.req.raw.headers,
        });

        return c.json(orgs, 200);
      } catch (error) {
        return c.json({ error: error }, 500);
      }
    }
  )
  .get(
    "/user",
    zValidator(
      "query",
      z
        .object({
          limit: z.coerce.number().int().positive(),
          offset: z.coerce.number().int().nonnegative(),
        })
        .strict()
    ),
    describeRoute({
      description: "Wypisz użytkowników",
      responses: {
        200: {
          description: "Pomyślne zapytanie",
          content: {
            [JsonMime]: {
              schema: resolver(z.object({ users: z.array(userSchema) })),
            },
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
        const { limit, offset } = c.req.valid("query");

        const session = await auth.api.getSession({
          headers: c.req.raw.headers,
        });

        const userId = session?.user.id;
        log("admin", "info", String(userId));
        if (!userId || session?.user.role != "admin")
          return c.json({ error: "Błąd autoryzacji" }, 401);

        const users = await auth.api.listUsers({
          query: {
            limit: limit,
            offset: offset,
          },
          headers: c.req.raw.headers,
        });

        return c.json(users, 200);
      } catch (error) {
        return c.json({ error: error }, 500);
      }
    }
  );

export default admin;
