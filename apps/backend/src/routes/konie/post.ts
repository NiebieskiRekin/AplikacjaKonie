import { InsertZdjecieKonia } from "@/backend/db/types";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi";
import { z } from "@hono/zod-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { auth, auth_vars } from "@/backend/auth";
import { db } from "@/backend/db";
import {
  konie,
  zdjeciaKoni,
  konieInsertSchema,
  konieSelectSchema,
} from "@/backend/db/schema";
import { log } from "@/backend/logs/logger";

const konie_post_response_success = z.object({
  message: z.string(),
  horse: konieSelectSchema,
});

const LoggerScope = "Konie Post";

export const konie_post = new Hono<auth_vars>().post(
  "/",
  zValidator(
    "form",
    konieInsertSchema
      .extend({
        rocznikUrodzenia: z.coerce.number(),
        dataPrzybyciaDoStajni: z.optional(z.string()),
        dataOdejsciaZeStajni: z.optional(z.string()),
        file: z.coerce.boolean(),
        // .custom<File | undefined>()
        // .refine((file) => !file || file?.size <= MAX_FILE_SIZE, {
        //   message: "Maksymalny rozmiar pliku wynosi 5MB.",
        // })
        // .refine(
        //   (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
        //   "Akceptowane są wyłącznie pliki o rozszerzeniach: .jpg, .jpeg, .png, .webp"
        // )
      })
      .omit({
        hodowla: true,
      })
      .strict()
  ),
  describeRoute({
    description: "Dodaj nowego konia do hodowli użytkownika",
    responses: {
      200: {
        description: "Pomyślne zapytanie",
        content: {
          [JsonMime]: { schema: resolver(konie_post_response_success) },
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
      const orgId = session?.session.activeOrganizationId;
      if (!userId || !orgId) return c.json({ error: "Błąd autoryzacji" }, 401);

      const formData = c.req.valid("form");

      const convert_empty_to_null = (date: string | null | undefined) => {
        if (date === null || date === undefined || date?.length == 0) {
          return null;
        } else {
          return date;
        }
      };

      const kon_to_insert = {
        ...formData,
        dataPrzybyciaDoStajni: convert_empty_to_null(
          formData.dataPrzybyciaDoStajni
        ),
        dataOdejsciaZeStajni: convert_empty_to_null(
          formData.dataOdejsciaZeStajni
        ),
        hodowla: orgId,
      };

      //Wstawienie danych do bazy
      const newHorse = (
        await db.insert(konie).values(kon_to_insert).returning()
      )[0];

      if (formData.file == true) {
        // const dimensions = imageSize(await formData.file!.bytes());

        // const photoValidationResult = zdjeciaKoniInsertSchema.safeParse({
        //   id: randomUUID(),
        //   kon: newHorse.id,
        //   width: dimensions.width,
        //   height: dimensions.height,
        //   file: formData.file?.name!,
        //   default: true,
        // });

        // if (!photoValidationResult.success) {
        //   return c.json(
        //     { success: false, error: photoValidationResult.error.flatten() },
        //     400
        //   );
        // }

        const img: InsertZdjecieKonia = {
          kon: newHorse.id,
          default: true,
        };

        const uuid_of_image = await db
          .insert(zdjeciaKoni)
          .values(img)
          .returning({ id: zdjeciaKoni.id });

        return c.json(
          {
            message: "Koń został dodany!",
            horse: newHorse,
            image_uuid: uuid_of_image[0],
          },
          200
        );
      }

      return c.json({ message: "Koń został dodany!", horse: newHorse }, 200);
    } catch (error) {
      log(
        LoggerScope,
        "error",
        "Błąd podczas dodawania konia:",
        error as Error
      );
      return c.json({ error: "Błąd podczas dodawania konia" }, 500);
    }
  }
);
