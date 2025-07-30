import { InsertZdjecieKonia } from "@/backend/db/types";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "@hono/zod-openapi";
import { JsonMime, response_failure_schema } from "@/backend/routes/constants";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  users,
  konie,
  zdjeciaKoni,
  konieInsertSchema,
  konieSelectSchema,
} from "@/backend/db/schema";

const konie_post_response_success = z.object({
  message: z.string(),
  horse: konieSelectSchema,
});

export const konie_post = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().post(
  "/",
  zValidator(
    "form",
    konieInsertSchema
      .extend({
        rocznikUrodzenia: z.number({ coerce: true }),
        dataPrzybyciaDoStajni: z.optional(z.string()),
        dataOdejsciaZeStajni: z.optional(z.string()),
        file: z.boolean({ coerce: true }),
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
      const userId = getUserFromContext(c);

      const hodowla = await db
        .select({ hodowla: users.hodowla })
        .from(users)
        .where(eq(users.id, userId));

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
        hodowla: hodowla[0].hodowla,
      };

      //Wstawienie danych do bazy
      const newHorse = (
        await db.insert(konie).values(kon_to_insert).returning()
      ).at(0)!;

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
        //   console.error(
        //     "Błąd walidacji formatu zdjecia:",
        //     photoValidationResult.error
        //   );
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
      console.error("Błąd podczas dodawania konia:", error);
      return c.json({ error: "Błąd podczas dodawania konia" }, 500);
    }
  }
);
