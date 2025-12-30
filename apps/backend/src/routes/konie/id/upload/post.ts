import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/backend/db";
import { konie, member, zdjeciaKoni } from "@/backend/db/schema";
import { InsertZdjecieKonia } from "@/backend/db/types";
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
      if (!userId) return c.json({ error: "Błąd autoryzacji" }, 400);

      const horseId = Number(c.req.param("id"));
      if (isNaN(horseId)) {
        return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
      }

      const hodowla = await db
        .select({ hodowlaId: member.organizationId })
        .from(member)
        .where(eq(member.userId, userId))
        .then((res) => res[0]);

      if (!hodowla.hodowlaId) {
        return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
      }

      const defaultImage = await db
        .select({
          id: zdjeciaKoni.id,
          kon: zdjeciaKoni.kon,
          default: zdjeciaKoni.default,
        })
        .from(zdjeciaKoni)
        .innerJoin(konie, eq(konie.id, zdjeciaKoni.kon))
        .where(
          and(
            eq(konie.hodowla, hodowla.hodowlaId),
            eq(zdjeciaKoni.kon, horseId),
            eq(zdjeciaKoni.default, true)
          )
        );

      const img: InsertZdjecieKonia = {
        kon: horseId,
        default: defaultImage.length === 0,
      };

      const uuid_of_image = await db
        .insert(zdjeciaKoni)
        .values(img)
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
