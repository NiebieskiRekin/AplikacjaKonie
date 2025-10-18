import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { konie } from "@/backend/db/schema";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const konie_id_delete_response_success = z.object({ success: z.string() });

const LoggerScope = "Konie ID Delete";

export const konie_id_delete = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().delete(
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
      const userId = getUserFromContext(c);
      if (!userId) {
        return c.json({ error: "Błąd autoryzacji" }, 401);
      }

      const horseId = Number(c.req.param("id"));
      if (isNaN(horseId)) {
        return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
      }

      const horse = await db
        .select()
        .from(konie)
        .where(eq(konie.id, horseId))
        .then((res) => res[0]);
      if (!horse) {
        return c.json({ error: "Koń nie istnieje" }, 404);
      }

      // Usuwamy konia
      await db
        .update(konie)
        .set({ active: false })
        .where(eq(konie.id, horseId));

      return c.json({ success: "Koń został usunięty" });
    } catch (error) {
      log(LoggerScope, "error", "Błąd podczas usuwania konia:", error as Error);
      return c.json({ error: "Błąd podczas usuwania konia" }, 500);
    }
  }
);
