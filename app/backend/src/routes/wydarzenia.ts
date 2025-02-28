import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { authMiddleware, getUserFromContext, UserPayload } from "../middleware/auth";
import { zdarzeniaProfilaktyczne, podkucia, users, konie, kowale, weterynarze } from "../db/schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const wydarzeniaRoute = new Hono<{ Variables: { user: UserPayload } }>();

wydarzeniaRoute.use(authMiddleware);

wydarzeniaRoute.get("/", async (c) => {
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

    const konieUzytkownika = await db
      .select({ id: konie.id, nazwa: konie.nazwa })
      .from(konie)
      .where(eq(konie.hodowla, hodowla));

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
    konie: z.array(z.number().positive()),
    kowal: z.number().positive(), 
    dataZdarzenia: z.string().date(),
    dataWaznosci: z.string().date().optional(),
  });

  const zdarzenieProfilaktyczneSchema = z.object({
    konie: z.array(z.number().positive()),
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
  
        const { konie, kowal, dataZdarzenia, dataWaznosci } = c.req.valid("json");
  
        await db.insert(podkucia).values(
          konie.map((konId) => ({
            kon: konId,
            kowal,
            dataZdarzenia,
            dataWaznosci: dataWaznosci || null,
          }))
        );
  
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
  
        const { konie, weterynarz, dataZdarzenia, dataWaznosci, rodzajZdarzenia, opisZdarzenia } = c.req.valid("json");
  
        await db.insert(zdarzeniaProfilaktyczne).values(
          konie.map((konId) => ({
            kon: konId,
            weterynarz,
            dataZdarzenia,
            dataWaznosci: dataWaznosci || null,
            rodzajZdarzenia,
            opisZdarzenia,
          }))
        );
  
        return c.json({ message: "Zdarzenie profilaktyczne dodane pomyślnie!" });
      } catch (error) {
        console.error("Błąd podczas dodawania zdarzenia profilaktycznego:", error);
        return c.json({ error: "Błąd serwera podczas dodawania zdarzenia" }, 500);
      }
    }
  );

export default wydarzeniaRoute;
