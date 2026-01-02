import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { konie, zdjeciaKoni } from "@/backend/db/schema";
import { JsonMime } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const konie_id_upload_post_response_success = z.object({
  message: z.string(),
  image_uuid: z.object({ id: z.string().uuid() }),
});

const konie_id_upload_post_response_error = z
  .object({ error: z.string() })
  .openapi({ example: { error: "Błąd zapytania" } });

export const konie_id_upload_post = new Hono<auth_vars>().post(
  "/:id{[0-9]+}/upload",
  describeRoute({
    description: "Dodaj wpis o dodaniu nowego zdjęcia dla danego konia",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_upload_post_response_success),
          },
        },
      },
      400: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_upload_post_response_error),
          },
        },
      },
      500: {
        description: "Błąd serwera",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_upload_post_response_error),
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
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const horseId = Number(c.req.param("id"));
      if (isNaN(horseId)) {
        return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
      }

      const kon = await db
        .select({ kon: konie.id })
        .from(konie)
        .where(and(eq(konie.hodowla, orgId), eq(konie.id, horseId)));

      if (kon.length === 0) {
        return c.json({ error: "Nie znaleziono konia" }, 400);
      }

      const uuid_of_image = await db
        .insert(zdjeciaKoni)
        .values({
          kon: horseId,
          default: sql`NOT EXISTS (
                SELECT 1 FROM ${zdjeciaKoni} 
                WHERE ${zdjeciaKoni.kon} = ${horseId} 
                AND ${zdjeciaKoni.default} = true
              )`,
        })
        .returning({ id: zdjeciaKoni.id });

      return c.json(
        { message: "Dodano nowe zdjęcie konia", image_uuid: uuid_of_image[0] },
        200
      );
    } catch (error) {
      log(
        "Konie Image Post",
        "error",
        "Błąd podczas dodawania konia:",
        error as Error
      );
      return c.json({ error: "Błąd podczas dodawania konia" }, 500);
    }
  }
);
