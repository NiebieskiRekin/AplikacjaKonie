import { Hono } from "hono";
import { eq, desc, sql, and } from "drizzle-orm";
import { konie, users, konieInsertSchema, choroby, leczenia, podkucia, rozrody, zdarzeniaProfilaktyczne, kowale, zdjeciaKoni} from "../db/schema";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { union } from 'drizzle-orm/pg-core'
import { InsertKon, RodzajKonia } from "src/db/types";

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

// add new koń
horses.post("/", zValidator("form", konieInsertSchema), async (c) => {
    try {
      const userId = getUserFromContext(c);
      // if (!userId) return c.json({ error: "Błąd autoryzacji" }, 401);
  
      const hodowla = db.$with("user_hodowla").as(
        db.select({ hodowla: users.hodowla })
        .from(users)
        .where(eq(users.id, userId)));
  
      // if (!hodowla) {
      //   return c.json({ error: "Nie znaleziono hodowli użytkownika" }, 403);
      // }
  
      const formData = await c.req.valid("form");
      
      // const body: InsertKon = {
      //   nazwa: formData.get("nazwa") as string,
      //   numerPrzyzyciowy: formData.get("numerPrzyzyciowy") as string,
      //   numerChipa: formData.get("numerChipa") as string,
      //   rocznikUrodzenia: parseInt(formData.get("rocznikUrodzenia") as string, 10),
      //   dataPrzybyciaDoStajni: formData.has("dataPrzybycia")
      //     ? (formData.get("dataPrzybycia") as string)
      //     : null,
      //   dataOdejsciaZeStajni: formData.has("dataOdejscia")
      //     ? (formData.get("dataOdejscia") as string)
      //     : null,
      //   hodowla: 0,
      //   rodzajKonia: formData.get("rodzajKonia") as RodzajKonia,
      //   plec: formData.get("plec") as "samiec" | "samica",
      // };

      // const body = {
      //   nazwa: formData.get("nazwa") as string,
      //   numerPrzyzyciowy: formData.get("numerPrzyzyciowy") as string,
      //   numerChipa: formData.get("numerChipa") as string,
      //   rocznikUrodzenia: parseInt(formData.get("rocznikUrodzenia") as string, 10),
      //   dataPrzybyciaDoStajni: formData.has("dataPrzybycia")
      //     ? (formData.get("dataPrzybycia" as string))
      //     : null,
      //   dataOdejsciaZeStajni: formData.has("dataOdejscia")
      //     ? (formData.get("dataOdejscia") as string)
      //     : null,
      //   rodzajKonia: formData.get("rodzajKonia") as "Konie hodowlane" | "Konie rekreacyjne" | "Źrebaki" | "Konie sportowe",
      //   plec: formData.get("plec") as "samiec" | "samica",
      //   hodowla: hodowla,
      // };
  
      // console.log("🐴 Otrzymane dane konia:", body);
  
      // const validationResult = konieInsertSchema.safeParse(body);
      // if (!validationResult.success) {
      //   console.error("Błąd walidacji:", validationResult.error);
      //   return c.json({ success: false, error: validationResult.error }, 400);
      // }
  
      //Wstawienie danych do bazy
      const newHorse = await db.with(hodowla).insert(konie).values({...formData, hodowla: sql`(select * from user_hodowla)`}).returning();
  
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
