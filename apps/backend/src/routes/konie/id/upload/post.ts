import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../db";
import { users, zdjeciaKoni } from "@/backend/db/schema";
import { InsertZdjecieKonia } from "@/backend/db/types";
import { describeRoute } from "hono-openapi";
import { JsonMime } from "@/backend/routes/constants";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";
import "@hono/zod-openapi";

const konie_id_upload_post_response_success = z.object({
  message: z.string(),
  image_uuid: z.object({ id: z.string().uuid() }),
});

const konie_id_upload_post_response_error = z
  .object({ error: z.string() })
  .openapi({ example: { error: "Błąd zapytania" } });

export const konie_id_upload_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
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
        desciption: "Błąd serwera",
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
      const userId = getUserFromContext(c);
      const horseId = Number(c.req.param("id"));
      if (isNaN(horseId)) {
        return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
      }

      const hodowla = await db
        .select({ hodowlaId: users.hodowla })
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]);

      if (!hodowla) {
        return c.json({ error: "Nie znaleziono hodowli dla użytkownika" }, 400);
      }

      const defaultImage = await db
        .select()
        .from(zdjeciaKoni)
        .where(
          and(eq(zdjeciaKoni.kon, horseId), eq(zdjeciaKoni.default, true))
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
      console.error("Błąd podczas dodawania konia:", error);
      return c.json({ error: "Błąd podczas dodawania konia" }, 500);
    }
  }
);
