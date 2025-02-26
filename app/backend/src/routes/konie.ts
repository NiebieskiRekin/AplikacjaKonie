import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { konie, users, konieInsertSchema, choroby, leczenia, podkucia, rozrody, zdarzeniaProfilaktyczne, kowale } from "../db/schema";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";

const horses = new Hono<{ Variables: { user: UserPayload } }>();

horses.use(authMiddleware);

horses.get("/", async (c) => {
  const user = getUserFromContext(c);

  if (!user) {
    return c.json({ error: "Błąd autoryzacji" }, 401);
  }

  console.log(`🔍 Pobieranie koni dla użytkownika: ${user.email}`);

  const hodowla = await db
    .select()
    .from(users)
    .where(eq(users.id, user.userId))
    .then((res) => res[0]);
  // Pobieramy konie tylko tej samej hodowli
  const horsesList = await db
    .select()
    .from(konie)
    .where(eq(konie.hodowla, hodowla.hodowla));

  console.log("🐴 Lista koni:", horsesList);

  return c.json(horsesList);
});

// add new koń
horses.post("/", async (c) => {
    try {
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);
  
      const hodowla = await db
        .select({ hodowla: users.hodowla })
        .from(users)
        .where(eq(users.id, user.userId))
        .then((res) => res[0]?.hodowla);
  
      if (!hodowla) {
        return c.json({ error: "Nie znaleziono hodowli użytkownika" }, 403);
      }
  
      const formData = await c.req.formData();
      const body = {
        nazwa: formData.get("nazwa") as string,
        numerPrzyzyciowy: formData.get("numerPrzyzyciowy") as string,
        numerChipa: formData.get("numerChipa") as string,
        rocznikUrodzenia: parseInt(formData.get("rocznikUrodzenia") as string, 10),
        dataPrzybyciaDoStajni: formData.get("dataPrzybyciaDoStajni")
          ? (formData.get("dataPrzybyciaDoStajni") as string)
          : null,
        dataOdejsciaZeStajni: formData.get("dataOdejsciaZeStajni")
          ? (formData.get("dataOdejsciaZeStajni") as string)
          : null,
        rodzajKonia: formData.get("rodzajKonia") as "Konie hodowlane" | "Konie rekreacyjne" | "Źrebaki" | "Konie sportowe",
        plec: formData.get("plec") as "samiec" | "samica",
        hodowla: hodowla,
      };
  
      console.log("🐴 Otrzymane dane konia:", body);
  
      const validationResult = konieInsertSchema.safeParse(body);
      if (!validationResult.success) {
        console.error("Błąd walidacji:", validationResult.error);
        return c.json({ success: false, error: validationResult.error }, 400);
      }
  
      //Wstawienie danych do bazy
      const newHorse = await db.insert(konie).values(body).returning();
  
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
  
    try { // raczej w przyszłości to będzie do zmiany na np. union_all ale się z tym męczyłem i nie działało
        const events = await Promise.all([
        db.select().from(rozrody).where(eq(rozrody.kon, horseId)).orderBy(desc(rozrody.dataZdarzenia)).limit(5),
        db.select().from(choroby).where(eq(choroby.kon, horseId)).orderBy(desc(choroby.dataRozpoczecia)).limit(5),
        db.select().from(leczenia).where(eq(leczenia.kon, horseId)).orderBy(desc(leczenia.dataZdarzenia)).limit(5),
        db.select().from(podkucia).where(eq(podkucia.kon, horseId)).orderBy(desc(podkucia.dataZdarzenia)).limit(5),
        db.select().from(zdarzeniaProfilaktyczne).where(eq(zdarzeniaProfilaktyczne.kon, horseId)).orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia)).limit(5),
        ]);

        const formattedEvents = [
            ...events[0].map(e => ({ type: "rozród", date: e.dataZdarzenia, description: e.opisZdarzenia })),
            ...events[1].map(e => ({ type: "choroba", date: e.dataRozpoczecia, description: e.opisZdarzenia })),
            ...events[2].map(e => ({ type: "leczenie", date: e.dataZdarzenia, description: e.opisZdarzenia })),
            ...events[3].map(e => ({ type: "podkucie", date: e.dataZdarzenia, description: e.dataWaznosci })),
            ...events[4].map(e => ({ type: "profilaktyka", date: e.dataZdarzenia, description: e.opisZdarzenia })),
        ]
        .sort((a, b) => new Date(b.date ?? "0000-00-00").getTime() - new Date(a.date ?? "0000-00-00").getTime())
        .slice(0, 5);
    
        return c.json(formattedEvents);
        } catch (error) {
        console.error("Błąd pobierania zdarzeń konia:", error);
        return c.json({ error: "Błąd pobierania zdarzeń konia." }, 500);
        }
    });

export default horses;
