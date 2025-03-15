import { Hono } from "hono";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  konie,
  users,
  konieInsertSchema,
  choroby,
  leczenia,
  podkucia,
  rozrody,
  zdarzeniaProfilaktyczne,
  zdjeciaKoni,
  konieUpdateSchema,
} from "../db/schema";
import { db } from "../db";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { union } from "drizzle-orm/pg-core";
import { z } from "zod";
import { generateV4ReadSignedUrl } from "./images";
import { InsertZdjecieKonia } from "../db/types";

// eslint-disable-next-line drizzle/enforce-delete-with-where
const konieRoute = new Hono<{ Variables: { jwtPayload:UserPayload} }>()
  .use(authMiddleware)
  .get("/", async (c) => {
  const userId = getUserFromContext(c);
  try {
    const user = db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .as("user_hodowla");

    // Pobieramy konie tylko tej samej hodowli

    const horsesList = await db
      .select({
        id: konie.id,
        nazwa: konie.nazwa,
        numerPrzyzyciowy: konie.numerPrzyzyciowy,
        // numerChipa: konie.numerChipa,
        // rocznikUrodzenia: konie.rocznikUrodzenia,
        // dataPrzybyciaDoStajni:konie.dataPrzybyciaDoStajni,
        // dataOdejsciaZeStajni: konie.dataOdejsciaZeStajni,
        // hodowla:konie.hodowla,
        rodzajKonia: konie.rodzajKonia,
        // plec: konie.plec,
        imageId: zdjeciaKoni.id,
      })
      .from(user)
      .innerJoin(
        konie,
        and(eq(user.hodowla, konie.hodowla), eq(konie.active, true))
      )
      .leftJoin(
        zdjeciaKoni,
        and(eq(konie.id, zdjeciaKoni.kon), eq(zdjeciaKoni.default, true))
      )
      .orderBy(sql`LOWER(${konie.nazwa})`);
    
      const images_urls = await Promise.allSettled(
        horsesList.map((horse) =>
          horse.imageId ? generateV4ReadSignedUrl(horse.imageId) : null
        )
      );

    return c.json({success: true, data: horsesList.map((k,i)=>{return {...k, img_url: images_urls[i].status === "fulfilled" ? images_urls[i].value! : null }})}, 200);
  } catch {
    return c.json({success: false, error: "Bład zapytania"}, 400);
  }
}).post(
  "/",
  zValidator(
    "form",
    konieInsertSchema
      .extend({
        rocznikUrodzenia: z.number({ coerce: true }),
        dataPrzybyciaDoStajni: z.optional(z.string()),
        dataOdejsciaZeStajni: z.optional(z.string()),
        // .custom<File | undefined>()
        // .refine((file) => !file || file?.size <= MAX_FILE_SIZE, {
        //   message: "Maksymalny rozmiar pliku wynosi 5MB.",
        // })
        // .refine(
        //   (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
        //   "Akceptowane są wyłącznie pliki o rozszerzeniach: .jpg, .jpeg, .png, .webp"
        // ),
      }).omit({
        hodowla: true
      })
      .strict()
  ),
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

      const img: InsertZdjecieKonia =  {
        kon: newHorse.id,
        default: true
      }

      const uuid_of_image = await db
        .insert(zdjeciaKoni)
        .values(img)
        .returning({ id: zdjeciaKoni.id });

      return c.json({ message: "Koń został dodany!", horse: newHorse, image_uuid: uuid_of_image[0]});
    } catch (error) {
      console.error("Błąd podczas dodawania konia:", error);
      return c.json({ error: "Błąd podczas dodawania konia" }, 500);
    }
  }
)
  .put("/:id{[0-9]+}", zValidator("json",konieUpdateSchema), async (c) => {
  // TODO: check if object can be edited by this user
  // const userId = getUserFromContext(c);

  const horseId = Number(c.req.param("id"));
  if (isNaN(horseId)) {
    return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
  }

  try {
    const d = c.req.valid("json");

    const updatedHorse = await db
      .update(konie)
      .set(d)
      .where(eq(konie.id, horseId))
      .returning();

    if (!updatedHorse) {
      return c.json({ error: "Nie udało się zaktualizować danych konia" }, 500);
    }

    return c.json({
      success: "Dane konia zostały zaktualizowane",
      horse: updatedHorse,
    });
  } catch (error) {
    console.error("Błąd aktualizacji konia:", error);
    return c.json({ error: "Błąd aktualizacji konia" }, 500);
  }
}).delete("/:id{[0-9]+}", async (c) => {
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
    await db.update(konie).set({ active: false }).where(eq(konie.id, horseId));

    return c.json({ success: "Koń został usunięty" });
  } catch (error) {
    console.error("Błąd podczas usuwania konia:", error);
    return c.json({ error: "Błąd podczas usuwania konia" }, 500);
  }
}).get("/:id{[0-9]+}", async (c) => {
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
    .where(and(eq(konie.id, horseId), eq(konie.active, true)))
    .then((res) => res[0]);

  if (!horse) {
    return c.json({ error: "Koń nie znaleziony" }, 404);
  }

  const images_names = await db
  .select({name: zdjeciaKoni.id})
  .from(zdjeciaKoni)
  .where(eq(zdjeciaKoni.kon,horse.id));

  const images_signed_urls = await Promise.all(
    images_names.map((img) => generateV4ReadSignedUrl(img.name))
  );

  return c.json({...horse, images_signed_urls});
})
  .get("/:id{[0-9]+}/events", async (c) => {
  const horseId = Number(c.req.param("id"));
  if (isNaN(horseId)) {
    return c.json({ error: "Nieprawidłowy identyfikator konia." }, 400);
  }

  try {
    const after_union = await union(
      db
        .select({
          type: sql<string>`'rozród'`,
          date: rozrody.dataZdarzenia,
          description: rozrody.opisZdarzenia,
        })
        .from(rozrody)
        .where(eq(rozrody.kon, horseId))
        .orderBy(desc(rozrody.dataZdarzenia))
        .limit(5),
      db
        .select({
          type: sql<string>`'choroba'`,
          date: choroby.dataRozpoczecia,
          description: choroby.opisZdarzenia,
        })
        .from(choroby)
        .where(eq(choroby.kon, horseId))
        .orderBy(desc(choroby.dataRozpoczecia))
        .limit(5),
      db
        .select({
          type: sql<string>`'leczenie'`,
          date: leczenia.dataZdarzenia,
          description: leczenia.opisZdarzenia,
        })
        .from(leczenia)
        .where(eq(leczenia.kon, horseId))
        .orderBy(desc(leczenia.dataZdarzenia))
        .limit(5),
      db
        .select({
          type: sql<string>`'podkucie'`,
          date: podkucia.dataZdarzenia,
          description: sql<string>`coalesce(to_char(data_waznosci, 'DD-MM-YYYY'),'nie podano daty ważności')`,
        })
        .from(podkucia)
        .where(eq(podkucia.kon, horseId))
        .orderBy(desc(podkucia.dataZdarzenia))
        .limit(5),
      db
        .select({
          type: sql<string>`'profilaktyka'`,
          date: zdarzeniaProfilaktyczne.dataZdarzenia,
          description: zdarzeniaProfilaktyczne.opisZdarzenia,
        })
        .from(zdarzeniaProfilaktyczne)
        .where(eq(zdarzeniaProfilaktyczne.kon, horseId))
        .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia))
        .limit(5)
    )
      .orderBy(sql`2 desc`)
      .limit(5);

    return c.json(after_union);
  } catch (error) {
    console.error("Błąd pobierania zdarzeń konia:", error);
    return c.json({ error: "Błąd pobierania zdarzeń konia." }, 500);
  }
}).get("/:id{[0-9]+}/active-events", async (c) => {
  const userId = getUserFromContext(c);
  if (!userId) {
    return c.json({ error: "Błąd autoryzacji" }, 401);
  }

  const horseId = Number(c.req.param("id"));
  if (isNaN(horseId)) {
    return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
  }

  try {
    const latestPodkucie = await db
      .select()
      .from(podkucia)
      .where(eq(podkucia.kon, horseId))
      .orderBy(desc(podkucia.dataZdarzenia))
      .limit(1)
      .then((res) => res[0]);

    // Pobieramy najnowsze zdarzenia profilaktyczne dla każdego unikalnego rodzaju zdarzenia
    const eventTypes = [
      "Odrobaczanie",
      "Podanie suplementów",
      "Szczepienie",
      "Dentysta",
    ];

    const latestProfilaktyczneEvents = await Promise.all(
      eventTypes.map(async (eventType) => {
        return db
          .select()
          .from(zdarzeniaProfilaktyczne)
          .where(
            and(
              eq(zdarzeniaProfilaktyczne.kon, horseId),
              eq(
                zdarzeniaProfilaktyczne.rodzajZdarzenia,
                eventType as
                  | "Odrobaczanie"
                  | "Podanie suplementów"
                  | "Szczepienie"
                  | "Dentysta"
                  | "Inne"
              )
            )
          )
          .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia))
          .limit(1)
          .then((res) => res[0] || null);
      })
    );

    const activeEvents = {
      podkucie: latestPodkucie || null,
      profilaktyczne: latestProfilaktyczneEvents.filter(
        (event) => event !== null
      ),
    };

    return c.json(activeEvents);
  } catch (error) {
    console.error("Błąd pobierania aktywnych zdarzeń:", error);
    return c.json({ error: "Błąd pobierania aktywnych zdarzeń." }, 500);
  }
}).get("/choroby/:id{[0-9]+}", async (c) => {
  const userId = getUserFromContext(c);
  if (!userId) {
    return c.json({ error: "Błąd autoryzacji" }, 401);
  }

  const horseId = Number(c.req.param("id"));
  if (isNaN(horseId)) {
    return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
  }

  const chorobaList = await db
    .select()
    .from(choroby)
    .where(eq(choroby.kon, horseId));

  return c.json(chorobaList);
});

// get kon per type
// horses.get("/typ/:type", async (c) => {
//     const user = getUserFromContext(c);
//     if (!user) {
//       return c.json({ error: "Błąd autoryzacji" }, 401);
//     }

//     const type = c.req.param("type") as "Konie hodowlane" | "Konie rekreacyjne" | "Źrebaki" | "Konie sportowe";

//     const hodowla = await db
//       .select()
//       .from(users)
//       .where(eq(users.id, user.userId))
//       .then((res) => res[0]);

//     if (!hodowla) return c.json({ error: "Nie znaleziono hodowli" }, 403);

//     const horsesList = await db
//       .select()
//       .from(konie)
//       .where(and(eq(konie.hodowla, hodowla.hodowla), eq(konie.rodzajKonia, type)));

//     return c.json(horsesList);
//   });

export default konieRoute;
