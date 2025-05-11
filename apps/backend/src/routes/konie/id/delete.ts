import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { konie } from "@/backend/db/schema";
import { describeRoute } from "hono-openapi";
import { JsonMime } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";
import "@hono/zod-openapi";

const konie_id_delete_response_success = z.object({ success: z.string() });

const konie_id_delete_response_error = z
  .object({ error: z.string() })
  .openapi({ example: { error: "Błąd zapytania" } });

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
            schema: resolver(konie_id_delete_response_error),
          },
        },
      },
      401: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_delete_response_error),
          },
        },
      },
      404: {
        description: "Koń nie istnieje",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_delete_response_error),
          },
        },
      },
      500: {
        description: "Błąd serwera",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_delete_response_error),
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
      console.error("Błąd podczas usuwania konia:", error);
      return c.json({ error: "Błąd podczas usuwania konia" }, 500);
    }
  }
);
