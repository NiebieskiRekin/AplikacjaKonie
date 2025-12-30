import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/backend/db";
import { konie, member } from "@/backend/db/schema";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const konie_id_delete_response_success = z.object({ success: z.string() });

const LoggerScope = "Konie ID Delete";

export const konie_id_delete = new Hono<auth_vars>().delete(
  "/:id{[0-9]+}",
  describeRoute({
    description: "Usuń konia z hodowli",
    responses: {
      200: {
        // ContentfulStatusCode
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_delete_response_success),
          },
        },
      },
      400: {
        description: "Nieprawidłowy identyfikator konia",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
      401: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
      404: {
        description: "Koń nie istnieje",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
      500: {
        description: "Błąd serwera",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
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
      if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const horseId = Number(c.req.param("id"));
      if (isNaN(horseId)) {
        return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
      }

      // Usuwamy konia
      // eslint-disable-next-line drizzle/enforce-update-with-where
      const kon = await db
        .update(konie)
        .set({ active: false })
        .from(member)
        .where(
          and(
            eq(konie.id, horseId),
            eq(konie.hodowla, member.organizationId),
            eq(member.userId, userId)
          )
        )
        .returning({
          id: konie.id,
        });

      if (kon.length == 0) {
        return c.json({ error: "Koń nie istnieje" }, 404);
      }

      return c.json({ success: "Koń został usunięty" });
    } catch (error) {
      log(LoggerScope, "error", "Błąd podczas usuwania konia:", error as Error);
      return c.json({ error: "Błąd podczas usuwania konia" }, 500);
    }
  }
);
