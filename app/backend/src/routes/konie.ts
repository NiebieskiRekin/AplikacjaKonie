import { Hono } from "hono";
import { eq, desc, sql, and, count} from "drizzle-orm";
import { konie, users, konieInsertSchema, choroby, leczenia, podkucia, rozrody, zdarzeniaProfilaktyczne, kowale, zdjeciaKoni, zdjeciaKoniInsertSchema} from "../db/schema";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { union } from 'drizzle-orm/pg-core'
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { imageSize } from 'image-size';


const horses = new Hono<{ Variables: UserPayload }>();

horses.use(authMiddleware);

horses.get("/",
  async (c) => {
  const userId = getUserFromContext(c);

  try{
    const user = db.select().from(users)
      .where(eq(users.id, userId)).as("user_hodowla");

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
      imageUrl: zdjeciaKoni.file
    })
    .from(user)
    .innerJoin(konie,eq(user.hodowla,konie.hodowla))
    .leftJoin(zdjeciaKoni,
        and(
          eq(konie.id,zdjeciaKoni.kon),
          eq(zdjeciaKoni.default, true)
        )
    );

    console.log("🐴 Lista koni:", horsesList);
    return c.json(horsesList);
    
   } catch (error){
    return c.json({error: "Błąd zapytania"})
   }

  
});

const MAX_FILE_SIZE = 1024*1024*5; // 5 MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"]

// add new koń
horses.post("/", zValidator("form", konieInsertSchema.extend({
  hodowla: z.optional(z.number()),
  rocznikUrodzenia: z.number({ coerce: true }),
  file:  z.custom<File | undefined>()
  .refine(file => (!file || file?.size <= MAX_FILE_SIZE)!,
    {message: "Maksymalny rozmiar pliku wynosi 5MB."})
  .refine(file => (!file || ACCEPTED_IMAGE_TYPES.includes(file?.type))!,
    "Akceptowane są wyłącznie pliki o rozszerzeniach: .jpg, .jpeg, .png, .webp")
}).strict()), async (c) => {
    try {
      const userId = getUserFromContext(c);

      const hodowla = db.$with("user_hodowla").as(
        db.select({ hodowla: users.hodowla })
        .from(users)
        .where(eq(users.id, userId)));
  
      const formData = c.req.valid("form");
  
      const validationResult = konieInsertSchema.extend({
        hodowla: z.optional(z.number()),
        dataPrzybyciaDoStajni: z.optional(z.string()),
        dataOdejsciaZeStajni: z.optional(z.string())
      }).safeParse(formData);
      if (!validationResult.success) {
        console.error("Błąd walidacji danych konia:", validationResult.error);
        return c.json({ success: false, error: validationResult.error.flatten() }, 400);
      }
  
      const convert_empty_to_null = (date: string | null | undefined ) => {
        if (date === null || date === undefined || date?.length == 0){
          return null;
        }
        else {
          return date;
        }
      }

      const kon_to_insert = {
        ...validationResult.data,
        dataPrzybyciaDoStajni: convert_empty_to_null(validationResult.data.dataPrzybyciaDoStajni),
        dataOdejsciaZeStajni: convert_empty_to_null(validationResult.data.dataOdejsciaZeStajni),
        hodowla: sql`(select * from user_hodowla)`
      };

      //Wstawienie danych do bazy
      // TODO: transakcyjność?
      // TODO: upload file to object storage
      const newHorse = (await db.with(hodowla).insert(konie).values(kon_to_insert).returning()).at(0)!;

      const dimensions = imageSize( await formData.file!.bytes())
      
      const photoValidationResult = zdjeciaKoniInsertSchema.safeParse({
        id: randomUUID(),
        kon: newHorse.id,
        width: dimensions.width,
        height: dimensions.height,
        file: formData.file?.name!,
        default: true 
      })

      if (!photoValidationResult.success) {
        console.error("Błąd walidacji formatu zdjecia:", photoValidationResult.error);
        return c.json({ success: false, error: photoValidationResult.error.flatten() }, 400);
      }

      await db.with(hodowla).insert(zdjeciaKoni).values(photoValidationResult.data).returning({id: zdjeciaKoni.id});

      return c.json({ message: "Koń został dodany!", horse: newHorse });
    } catch (error) {
      console.error("Błąd podczas dodawania konia:", error);
      return c.json({ error: "Błąd podczas dodawania konia" }, 500);
    }
  });

  horses.get("/:id", async (c) => {
    const user = getUserFromContext(c);
    if (!user) {
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
      return c.json({ error: "Koń nie znaleziony" }, 404);
    }
  
    return c.json(horse);
  });

  horses.get("/:id/events", async (c) => {
    const horseId = Number(c.req.param("id"));
    if (isNaN(horseId)) {
      return c.json({ error: "Nieprawidłowy identyfikator konia." }, 400);
    }
  
    try { 
        const after_union = await union(
          db.select({ type: sql<string>`'rozród'`, date: rozrody.dataZdarzenia, description: rozrody.opisZdarzenia }).from(rozrody).where(eq(rozrody.kon, horseId)).orderBy(desc(rozrody.dataZdarzenia)).limit(5),
          db.select({ type: sql<string>`'choroba'`, date: choroby.dataRozpoczecia, description: choroby.opisZdarzenia }).from(choroby).where(eq(choroby.kon, horseId)).orderBy(desc(choroby.dataRozpoczecia)).limit(5),
          db.select({ type: sql<string>`'leczenie'`, date: leczenia.dataZdarzenia, description: leczenia.opisZdarzenia }).from(leczenia).where(eq(leczenia.kon, horseId)).orderBy(desc(leczenia.dataZdarzenia)).limit(5),
          db.select({ type: sql<string>`'podkucie'`, date: podkucia.dataZdarzenia , description: sql<string>`coalesce(to_char(data_waznosci, 'DD-MM-YYYY'),'nie podano daty ważności')` }).from(podkucia).where(eq(podkucia.kon, horseId)).orderBy(desc(podkucia.dataZdarzenia)).limit(5),
          db.select({ type: sql<string>`'profilaktyka'`, date: zdarzeniaProfilaktyczne.dataZdarzenia, description: zdarzeniaProfilaktyczne.opisZdarzenia }).from(zdarzeniaProfilaktyczne).where(eq(zdarzeniaProfilaktyczne.kon, horseId)).orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia)).limit(5)
         ).orderBy(sql`2 desc`).limit(5);
    
          return c.json(after_union);
        } catch (error) {
        console.error("Błąd pobierania zdarzeń konia:", error);
        return c.json({ error: "Błąd pobierania zdarzeń konia." }, 500);
        }
    });

export default horses;
