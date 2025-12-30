import { Hono } from "hono";
import { auth, auth_vars } from "@/backend/auth";
import { eq, and, getTableColumns } from "drizzle-orm";
import { db } from "@/backend/db";
import { konie, konieSelectSchema, zdjeciaKoni } from "@/backend/db/schema";
import { generateV4ReadSignedUrl } from "@/backend/routes/images";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { resolver } from "hono-openapi";
import { describeRoute } from "hono-openapi";
import { z } from "@hono/zod-openapi";

const konie_id_get_response_success = konieSelectSchema.extend({
  images_signed_urls: z.array(z.url()),
});

export const konie_id_get = new Hono<auth_vars>().get(
  "/:id{[0-9]+}",
  describeRoute({
    description: "Wyświetl szczegółowe informacje o koniu",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: {
            schema: resolver(konie_id_get_response_success),
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
      401: {
        description: "Błąd klienta",
        content: {
          [JsonMime]: {
            schema: resolver(response_failure_schema),
          },
        },
      },
      404: {
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

    const horse = await db
      .select({ ...getTableColumns(konie) })
      .from(konie)
      .where(
        and(
          eq(konie.id, horseId),
          eq(konie.hodowla, orgId),
          eq(konie.active, true)
        )
      )
      .then((res) => res[0]);

    if (!horse) {
      return c.json({ error: "Koń nie znaleziony" }, 404);
    }

    const images_names = await db
      .select({ name: zdjeciaKoni.id })
      .from(zdjeciaKoni)
      .where(eq(zdjeciaKoni.kon, horse.id));

    const images_signed_urls = await Promise.all(
      images_names.map((img) => generateV4ReadSignedUrl(img.name))
    );

    return c.json({ ...horse, images_signed_urls }, 200);
  }
);
