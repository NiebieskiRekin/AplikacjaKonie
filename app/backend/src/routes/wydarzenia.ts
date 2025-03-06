import { Hono } from "hono";
import { eq, or, and } from "drizzle-orm";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";
import { zdarzeniaProfilaktyczne, podkucia, users, konie, kowale, weterynarze, choroby, leczenia, rozrody } from "../db/schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const wydarzeniaRoute = new Hono<{ Variables: UserPayload }>();

wydarzeniaRoute.use(authMiddleware);

wydarzeniaRoute.get("/", async (c) => {
    const user = getUserFromContext(c);
    // if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

    const hodowla = await db
      .select({ hodowla: users.hodowla })
      .from(users)
      .where(eq(users.id, user))
      .then((res) => res[0]?.hodowla);

    if (!hodowla) {
      return c.json({ error: "Nie znaleziono hodowli użytkownika" }, 403);
    }

    const konieUzytkownika = await db
      .select({ id: konie.id, nazwa: konie.nazwa })
      .from(konie)
      .where(and(eq(konie.hodowla, hodowla), eq(konie.active, true)));

    const konieMap = Object.fromEntries(konieUzytkownika.map(kon => [kon.id, kon.nazwa]));

    const zdarzenia = await db
    .select({
      id: zdarzeniaProfilaktyczne.id,
      kon: zdarzeniaProfilaktyczne.kon,
      dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
      dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
      rodzajZdarzenia: zdarzeniaProfilaktyczne.rodzajZdarzenia,
      opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
      weterynarzId: zdarzeniaProfilaktyczne.weterynarz,
      weterynarzImieNazwisko: weterynarze.imieINazwisko, 
    })
    .from(zdarzeniaProfilaktyczne)
    .innerJoin(weterynarze, eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id))
    .where(or(...konieUzytkownika.map(kon => eq(zdarzeniaProfilaktyczne.kon, kon.id))));
  
      const podkuciaData = await db
      .select({
        id: podkucia.id,
        kon: podkucia.kon,
        dataPodkucia: podkucia.dataZdarzenia,
        dataWaznosci: podkucia.dataWaznosci,
        kowalId: podkucia.kowal,
        kowalImieNazwisko: kowale.imieINazwisko,
      })
      .from(podkucia)
      .innerJoin(kowale, eq(podkucia.kowal, kowale.id))
      .where(or(...konieUzytkownika.map(kon => eq(podkucia.kon, kon.id))));
    

      const events = [
        ...zdarzenia.map(event => ({
          horse: konieMap[event.kon] || "Nieznany koń",
          date: event.dataZdarzenia,
          rodzajZdarzenia: event.rodzajZdarzenia,
          dataWaznosci: event.dataWaznosci || "-",
          osobaImieNazwisko: event.weterynarzImieNazwisko || "Brak danych",
          opisZdarzenia: event.opisZdarzenia,
        })),
        ...podkuciaData.map(event => ({
          horse: konieMap[event.kon] || "Nieznany koń",
          date: event.dataPodkucia,
          rodzajZdarzenia: "Podkuwanie",
          dataWaznosci: event.dataWaznosci || "-",
          osobaImieNazwisko: event.kowalImieNazwisko || "Brak danych",
          opisZdarzenia: "-",
        })),
      ];

    events.sort((a, b) => new Date(b.date ?? "0000-00-00").getTime() - new Date(a.date ?? "0000-00-00").getTime());

    return c.json(events);
});


const podkucieSchema = z.object({
    konieId: z.array(z.number().positive()),
    kowal: z.number().positive(), 
    dataZdarzenia: z.string().date(),
    dataWaznosci: z.string().date().optional(),
  });

  const zdarzenieProfilaktyczneSchema = z.object({
    konieId: z.array(z.number().positive()),
    weterynarz: z.number().positive(), 
    dataZdarzenia: z.string().date(),
    dataWaznosci: z.string().date().optional(),
    rodzajZdarzenia: z.enum(["Odrobaczanie", "Podanie suplementów", "Szczepienie", "Dentysta", "Inne"]),
    opisZdarzenia: z.string().min(5),
  });
  
  wydarzeniaRoute.post(
    "/podkucie",
    zValidator("json", podkucieSchema),
    async (c) => {
  
      try {
        const user = getUserFromContext(c);
        if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);
  
        const { konieId, kowal, dataZdarzenia } = c.req.valid("json");
  
        const konieInfo = await db
          .select({ id: konie.id, rodzajKonia: konie.rodzajKonia })
          .from(konie)
          .where(or(...konieId.map((konieId) => eq(konie.id, konieId))));
  
        // Obliczamy datę ważności na podstawie rodzaju konia
        const valuesToInsert = konieInfo.map((kon) => {
          const baseDate = new Date(dataZdarzenia);
  
          if (kon.rodzajKonia === "Konie sportowe" || kon.rodzajKonia === "Konie rekreacyjne") {
            baseDate.setDate(baseDate.getDate() + 42); // +6 tygodni
          } else {
            baseDate.setDate(baseDate.getDate() + 84); // +12 tygodni
          }
  
          return {
            kon: kon.id,
            kowal,
            dataZdarzenia,
            dataWaznosci: baseDate.toISOString().split("T")[0], // YYYY-MM-DD
          };
        });
  
        await db.insert(podkucia).values(valuesToInsert);
  
        return c.json({ message: "Podkucie dodane pomyślnie!" });
      } catch (error) {
        console.error("Błąd podczas dodawania podkucia:", error);
        return c.json({ error: "Błąd serwera podczas dodawania podkucia" }, 500);
      }
    }
  );
  
  wydarzeniaRoute.post(
    "/zdarzenie-profilaktyczne",
    zValidator("json", zdarzenieProfilaktyczneSchema),
    async (c) => {
  
      try {
        const user = getUserFromContext(c);
        if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);
  
        const { konieId, weterynarz, dataZdarzenia, rodzajZdarzenia, opisZdarzenia } = c.req.valid("json");
  
        const konieInfo = await db
          .select({ id: konie.id, rodzajKonia: konie.rodzajKonia })
          .from(konie)
          .where(or(...konieId.map((konieId) => eq(konie.id, konieId))));
  
        const valuesToInsert = konieInfo.map((kon) => {
          const baseDate = new Date(dataZdarzenia);
  
          let monthsToAdd = 0;
  
          if (rodzajZdarzenia === "Szczepienie") {
            monthsToAdd = kon.rodzajKonia === "Konie sportowe" ? 6 : 12;
          } else if (rodzajZdarzenia === "Dentysta") {
            monthsToAdd = ["Konie sportowe", "Konie rekreacyjne"].includes(kon.rodzajKonia) ? 6 : 12;
          } else if (["Podanie witamin", "Odrobaczanie"].includes(rodzajZdarzenia)) {
            monthsToAdd = 6;
          }
  
          baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
  
          return {
            kon: kon.id,
            weterynarz,
            dataZdarzenia,
            dataWaznosci: baseDate.toISOString().split("T")[0], // YYYY-MM-DD
            rodzajZdarzenia,
            opisZdarzenia,
          };
        });
  
        await db.insert(zdarzeniaProfilaktyczne).values(valuesToInsert);
  
        return c.json({ message: "Zdarzenie profilaktyczne dodane pomyślnie!" });
      } catch (error) {
        console.error("Błąd podczas dodawania zdarzenia profilaktycznego:", error);
        return c.json({ error: "Błąd serwera podczas dodawania zdarzenia" }, 500);
      }
    }
  );  

  wydarzeniaRoute.get("/:id{[0-9]+}/:type{[A-Za-z_]+}", async (c) => {
    const horseId = Number(c.req.param("id"));
    const eventType = c.req.param("type").toLowerCase();
    console.log(horseId, eventType);

    if (isNaN(horseId)) {
        return c.json({ error: "Nieprawidłowy identyfikator konia" }, 400);
    }

    try {
        let events;

        switch (eventType) {
            case "choroby":
                events = await db.select().from(choroby).where(eq(choroby.kon, horseId));
                break;
            case "leczenia":
                events = await db.select().from(leczenia).where(eq(leczenia.kon, horseId));
                break;
            case "rozrody":
                events = await db.select().from(rozrody).where(eq(rozrody.kon, horseId));
                break;
            case "zdarzenia_profilaktyczne":
                events = await db.select().from(zdarzeniaProfilaktyczne).where(eq(zdarzeniaProfilaktyczne.kon, horseId));
                break;
            case "podkucia":
                events = await db.select().from(podkucia).where(eq(podkucia.kon, horseId));
                break;
            default:
                return c.json({ error: "Nieznany typ zdarzenia" }, 400);
        }

        return c.json(events);
    } catch (error) {
        console.error("Błąd pobierania wydarzeń:", error);
        return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  });

export default wydarzeniaRoute;
