import { Hono } from "hono";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { users } from "@/backend/db/schema";
import { db } from "@/backend/db";
import {
  access_cookie_opts,
  ACCESS_TOKEN,
  createAuthTokens,
  refresh_cookie_opts,
  REFRESH_TOKEN,
} from "@/backend/middleware/auth";
import { setCookie } from "hono/cookie";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

const login = new Hono().post(
  "/",
  zValidator(
    "json",
    z.object({
      email: z
        .string({ message: "Email jest wymagany" })
        .email({ message: "Niepoprawny format adresu email" }),
      password: z.string({ message: "Hasło jest wymagane" }),
    })
  ),
  describeRoute({
    description: "Zaloguj się do usługi",
    responses: {
      201: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(
              z.object({
                status: z
                  .string()
                  .openapi({
                    example: "Logowanie poprawne",
                    description: "Odpowiedź serwera",
                  }),
              })
            ),
          },
        },
      },
      401: {
        description: "Bład autoryzacji",
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
      const { email, password } = c.req.valid("json");

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

      const tokens = await createAuthTokens({
        userId: user.id,
        refreshTokenVersion: user.refreshTokenVersion,
      });

      setCookie(c, ACCESS_TOKEN, tokens.accessToken, access_cookie_opts);
      setCookie(c, REFRESH_TOKEN, tokens.refreshToken, refresh_cookie_opts);

      return c.json({ status: "Logowanie poprawne" }, 200);
    } catch (error) {
      console.log(error);
      return c.json({ error: "Błąd podczas logowania" }, 500);
    }
  }
);

export default login;
