import { Hono } from "hono";
import { eq, desc, sql, and } from "drizzle-orm";
import { konie, users, konieInsertSchema, choroby, leczenia, podkucia, rozrody, zdarzeniaProfilaktyczne, kowale } from "../db/schema";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";
import { zValidator } from "@hono/zod-validator";
import { union } from 'drizzle-orm/pg-core'

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

// get kon per type
horses.get("/typ/:type", async (c) => {
    const user = getUserFromContext(c);
    if (!user) {
      return c.json({ error: "Błąd autoryzacji" }, 401);
    }
  
    const type = c.req.param("type") as "Konie hodowlane" | "Konie rekreacyjne" | "Źrebaki" | "Konie sportowe";
    
    const hodowla = await db
      .select()
      .from(users)
      .where(eq(users.id, user.userId))
      .then((res) => res[0]);
  
    if (!hodowla) return c.json({ error: "Nie znaleziono hodowli" }, 403);
  
    const horsesList = await db
      .select()
      .from(konie)
      .where(and(eq(konie.hodowla, hodowla.hodowla), eq(konie.rodzajKonia, type)));
    
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
        dataPrzybyciaDoStajni: formData.has("dataPrzybycia")
          ? (formData.get("dataPrzybycia" as string))
          : null,
        dataOdejsciaZeStajni: formData.has("dataOdejscia")
          ? (formData.get("dataOdejscia") as string)
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
      const newHorse = await db.insert(konie).values(validationResult.data).returning();
  
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

    horses.get("/:id/active-events", async (c) => {
      const user = getUserFromContext(c);
      if (!user) {
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
          const eventTypes = ["Odrobaczanie", "Podanie suplementów", "Szczepienie", "Dentysta"];
  
          const latestProfilaktyczneEvents = await Promise.all(
              eventTypes.map(async (eventType) => {
                  return db
                      .select()
                      .from(zdarzeniaProfilaktyczne)
                      .where(and(eq(zdarzeniaProfilaktyczne.kon, horseId), eq(zdarzeniaProfilaktyczne.rodzajZdarzenia, eventType as "Odrobaczanie" | "Podanie suplementów" | "Szczepienie" | "Dentysta" | "Inne")))
                      .orderBy(desc(zdarzeniaProfilaktyczne.dataZdarzenia))
                      .limit(1)
                      .then((res) => res[0] || null);
              })
          );
  
          const activeEvents = {
              podkucie: latestPodkucie || null,
              profilaktyczne: latestProfilaktyczneEvents.filter((event) => event !== null),
          };
  
          return c.json(activeEvents);
      } catch (error) {
          console.error("Błąd pobierania aktywnych zdarzeń:", error);
          return c.json({ error: "Błąd pobierania aktywnych zdarzeń." }, 500);
      }
  });

export default horses;
