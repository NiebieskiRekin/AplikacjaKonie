import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/backend/db";
import { zdjeciaKoni, konie } from "@/backend/db/schema";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { log } from "@/backend/logs/logger";

const konie_id_imageId_delete_response_success = z.object({
  message: z.string(),
});

export const konie_id_imageId_delete = new Hono<auth_vars>().delete(
  "/:id{[0-9]+}/:imageId{[A-Za-z0-9-]+}",
  describeRoute({
    description: "Usuń wskazane zdjęcie danego konia",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_imageId_delete_response_success),
          },
        },
      },
      400: {
        description: "Błąd klienta",
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
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const horseId = Number(c.req.param("id"));
      const imageId = String(c.req.param("imageId"));

      if (isNaN(horseId)) {
        return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
      }
      if (!imageId || imageId.trim() === "") {
        return c.json({ error: "Nieprawidłowy identyfikator zdjęcia" }, 400);
      }

      const imageToDelete = await db
        .select()
        .from(zdjeciaKoni)
        .innerJoin(konie, eq(konie.id, zdjeciaKoni.kon))
        .where(
          and(
            eq(zdjeciaKoni.kon, horseId),
            eq(konie.hodowla, orgId),
            eq(zdjeciaKoni.id, imageId)
          )
        )
        .then((res) => res[0].zdjecia_koni);

      if (imageToDelete.default == true) {
        const nextDefaultImage = await db
          .select()
          .from(zdjeciaKoni)
          .where(
            and(eq(zdjeciaKoni.kon, horseId), eq(zdjeciaKoni.default, false))
          )
          .orderBy(desc(zdjeciaKoni.id))
          .limit(1)
          .then((res) => res[0]);

        if (nextDefaultImage) {
          await db
            .update(zdjeciaKoni)
            .set({ default: true })
            .where(eq(zdjeciaKoni.id, nextDefaultImage.id));
        }
      }
      await db
        .delete(zdjeciaKoni)
        .where(and(eq(zdjeciaKoni.kon, horseId), eq(zdjeciaKoni.id, imageId)));

      return c.json({ message: "Usunięto zdjęcie konia" }, 200);
    } catch (error) {
      log(
        "Konie Image Delete",
        "error",
        "Błąd podczas usuwania zdjęcia konia:",
        error as Error
      );
      return c.json({ error: "Błąd podczas usuwania zdjęcia konia" }, 500);
    }
  }
);
