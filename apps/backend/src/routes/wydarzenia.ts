import { Hono } from "hono";
import { eq, or, and } from "drizzle-orm";
import { db } from "../db";
import {
  authMiddleware,
  getUserFromContext,
  UserPayload,
} from "../middleware/auth";
import {
  zdarzeniaProfilaktyczne,
  podkucia,
  users,
  konie,
  kowale,
  weterynarze,
  rozrody,
  choroby,
  leczenia,
  rozrodyInsertSchema,
  chorobyInsertSchema,
  leczeniaInsertSchema,
  chorobyUpdateSchema,
  leczeniaUpdateSchema,
  rozrodyUpdateSchema,
  zdarzeniaProfilaktyczneUpdateSchema,
  podkuciaUpdateSchema,
} from "../db/schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// const eventTypes = z.enum(["choroby", "leczenia", "rozrody", "zdarzenia_profilaktyczne","podkucie"])

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
  rodzajZdarzenia: z.enum([
    "Odrobaczanie",
    "Podanie suplementów",
    "Szczepienie",
    "Dentysta",
    "Inne",
  ]),
  opisZdarzenia: z.string().min(5),
});

// eslint-disable-next-line drizzle/enforce-delete-with-where
const wydarzeniaRoute = new Hono<{ Variables: { jwtPayload: UserPayload } }>()
  .use(authMiddleware)
  .get("/", async (c) => {
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

    const konieMap = Object.fromEntries(
      konieUzytkownika.map((kon) => [kon.id, kon.nazwa])
    );

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
      .innerJoin(
        weterynarze,
        eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
      )
      .where(
        or(
          ...konieUzytkownika.map((kon) =>
            eq(zdarzeniaProfilaktyczne.kon, kon.id)
          )
        )
      );

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
      .where(or(...konieUzytkownika.map((kon) => eq(podkucia.kon, kon.id))));

    const events = [
      ...zdarzenia.map((event) => ({
        horse: konieMap[event.kon] || "Nieznany koń",
        date: event.dataZdarzenia,
        rodzajZdarzenia: event.rodzajZdarzenia,
        dataWaznosci: event.dataWaznosci || "-",
        osobaImieNazwisko: event.weterynarzImieNazwisko || "Brak danych",
        opisZdarzenia: event.opisZdarzenia,
      })),
      ...podkuciaData.map((event) => ({
        horse: konieMap[event.kon] || "Nieznany koń",
        date: event.dataPodkucia,
        rodzajZdarzenia: "Podkuwanie",
        dataWaznosci: event.dataWaznosci || "-",
        osobaImieNazwisko: event.kowalImieNazwisko || "Brak danych",
        opisZdarzenia: "-",
      })),
    ];

    events.sort(
      (a, b) =>
        new Date(b.date ?? "0000-00-00").getTime() -
        new Date(a.date ?? "0000-00-00").getTime()
    );

    return c.json(events);
  })
  .post("/rozrody", zValidator("json", rozrodyInsertSchema), async (c) => {
    const _rozrody = c.req.valid("json");
    console.log(_rozrody);
    _rozrody.kon = Number(_rozrody.kon);
    _rozrody.weterynarz = Number(_rozrody.weterynarz);

    const result = await db
      .insert(rozrody)
      .values(_rozrody)
      .returning()
      .then((res) => res[0]);

    return c.json(result, 201);
  })
  .post("/choroby", zValidator("json", chorobyInsertSchema), async (c) => {
    const _choroby = c.req.valid("json");
    _choroby.kon = Number(_choroby.kon);

    const result = await db
      .insert(choroby)
      .values(_choroby)
      .returning()
      .then((res) => res[0]);

    return c.json(result, 201);
  })
  .post("/leczenia", zValidator("json", leczeniaInsertSchema), async (c) => {
    const _leczenia = c.req.valid("json");
    _leczenia.kon = Number(_leczenia.kon);

    const result = await db
      .insert(leczenia)
      .values(_leczenia)
      .returning()
      .then((res) => res[0]);

    return c.json(result, 201);
  })
  .post("/podkucie", zValidator("json", podkucieSchema), async (c) => {
    try {
      const user = getUserFromContext(c);
      if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

      const { konieId, kowal, dataZdarzenia, dataWaznosci } =
        c.req.valid("json");

      const konieInfo = await db
        .select({ id: konie.id, rodzajKonia: konie.rodzajKonia })
        .from(konie)
        .where(or(...konieId.map((konieId) => eq(konie.id, konieId))));

      // Obliczamy datę ważności na podstawie rodzaju konia
      const valuesToInsert = konieInfo.map((kon) => {
        let calculatedDate = dataWaznosci;
        if (!calculatedDate) {
          const baseDate = new Date(dataZdarzenia);

          if (
            kon.rodzajKonia === "Konie sportowe" ||
            kon.rodzajKonia === "Konie rekreacyjne"
          ) {
            baseDate.setDate(baseDate.getDate() + 42); // +6 tygodni
          } else {
            baseDate.setDate(baseDate.getDate() + 84); // +12 tygodni
          }
          calculatedDate = baseDate.toISOString().split("T")[0];
        }

        return {
          kon: kon.id,
          kowal,
          dataZdarzenia,
          dataWaznosci: calculatedDate,
        };
      });

      await db.insert(podkucia).values(valuesToInsert);

      return c.json({ message: "Podkucie dodane pomyślnie!" }, 200);
    } catch (error) {
      console.error("Błąd podczas dodawania podkucia:", error);
      return c.json({ error: "Błąd serwera podczas dodawania podkucia" }, 500);
    }
  })
  .post(
    "/zdarzenia_profilaktyczne",
    zValidator("json", zdarzenieProfilaktyczneSchema),
    async (c) => {
      try {
        const user = getUserFromContext(c);
        if (!user) return c.json({ error: "Błąd autoryzacji" }, 401);

        const {
          konieId,
          weterynarz,
          dataZdarzenia,
          rodzajZdarzenia,
          opisZdarzenia,
          dataWaznosci,
        } = c.req.valid("json");

        const konieInfo = await db
          .select({ id: konie.id, rodzajKonia: konie.rodzajKonia })
          .from(konie)
          .where(or(...konieId.map((konieId) => eq(konie.id, konieId))));

        const valuesToInsert = konieInfo.map((kon) => {
          let calculatedDate = dataWaznosci;
          if (!calculatedDate) {
            const baseDate = new Date(dataZdarzenia);

            let monthsToAdd = 0;

            if (rodzajZdarzenia === "Szczepienie") {
              monthsToAdd = kon.rodzajKonia === "Konie sportowe" ? 6 : 12;
            } else if (rodzajZdarzenia === "Dentysta") {
              monthsToAdd = ["Konie sportowe", "Konie rekreacyjne"].includes(
                kon.rodzajKonia
              )
                ? 6
                : 12;
            } else if (
              ["Podanie witamin", "Odrobaczanie"].includes(rodzajZdarzenia)
            ) {
              monthsToAdd = 6;
            }

            baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
            calculatedDate = baseDate.toISOString().split("T")[0];
          }

          return {
            kon: kon.id,
            weterynarz,
            dataZdarzenia,
            dataWaznosci: calculatedDate,
            rodzajZdarzenia,
            opisZdarzenia,
          };
        });

        await db.insert(zdarzeniaProfilaktyczne).values(valuesToInsert);

        return c.json(
          { message: "Zdarzenie profilaktyczne dodane pomyślnie!" },
          200
        );
      } catch (error) {
        console.error(
          "Błąd podczas dodawania zdarzenia profilaktycznego:",
          error
        );
        return c.json(
          { error: "Błąd serwera podczas dodawania zdarzenia" },
          500
        );
      }
    }
  )
  .get("/:id{[0-9]+}/:type{[A-Za-z_]+}", async (c) => {
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
          events = await db
            .select({
              _id: choroby.id,
              dataRozpoczecia: choroby.dataRozpoczecia,
              dataZakonczenia: choroby.dataZakonczenia,
              opisZdarzenia: choroby.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(choroby)
            .innerJoin(konie, eq(choroby.kon, konie.id))
            .where(eq(choroby.kon, horseId));
          break;
        case "leczenia":
          events = await db
            .select({
              _id: leczenia.id,
              dataZdarzenia: leczenia.dataZdarzenia,
              weterynarz: weterynarze.imieINazwisko,
              choroba: choroby.opisZdarzenia,
              opisZdarzenia: leczenia.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(leczenia)
            .innerJoin(weterynarze, eq(leczenia.weterynarz, weterynarze.id))
            .innerJoin(choroby, eq(leczenia.choroba, choroby.id))
            .innerJoin(konie, eq(leczenia.kon, konie.id))
            .where(eq(leczenia.kon, horseId));
          break;
        case "rozrody":
          events = await db
            .select({
              _id: rozrody.id,
              dataZdarzenia: rozrody.dataZdarzenia,
              weterynarz: weterynarze.imieINazwisko,
              rodzajZdarzenia: rozrody.rodzajZdarzenia,
              opisZdarzenia: rozrody.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(rozrody)
            .innerJoin(weterynarze, eq(rozrody.weterynarz, weterynarze.id))
            .innerJoin(konie, eq(rozrody.kon, konie.id))
            .where(eq(rozrody.kon, horseId));
          break;
        case "zdarzenia_profilaktyczne":
          events = await db
            .select({
              _id: zdarzeniaProfilaktyczne.id,
              dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
              dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
              weterynarz: weterynarze.imieINazwisko,
              rodzajZdarzenia: zdarzeniaProfilaktyczne.rodzajZdarzenia,
              opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(zdarzeniaProfilaktyczne)
            .innerJoin(konie, eq(zdarzeniaProfilaktyczne.kon, konie.id))
            .innerJoin(
              weterynarze,
              eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
            )
            .where(eq(zdarzeniaProfilaktyczne.kon, horseId));
          break;
        case "podkucia":
          events = await db
            .select({
              _id: podkucia.id,
              dataZdarzenia: podkucia.dataZdarzenia,
              dataWaznosci: podkucia.dataWaznosci,
              kowal: kowale.imieINazwisko,
              nazwaKonia: konie.nazwa,
            })
            .from(podkucia)
            .innerJoin(konie, eq(podkucia.kon, konie.id))
            .innerJoin(kowale, eq(podkucia.kowal, kowale.id))
            .where(eq(podkucia.kon, horseId));
          break;
        default:
          return c.json({ error: "Nieznany typ zdarzenia" }, 400);
      }

      return c.json(events);
    } catch (error) {
      console.error("Błąd pobierania wydarzeń:", error);
      return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  })
  .get("/:type{[A-Za-z_-]+}/:id{[0-9]+}", async (c) => {
    const eventId = Number(c.req.param("id"));
    const eventType = c.req.param("type").toLowerCase();
    console.log(eventId, eventType);

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      let events;

      switch (eventType) {
        case "choroby":
          events = await db
            .select({
              _id: choroby.id,
              dataRozpoczecia: choroby.dataRozpoczecia,
              dataZakonczenia: choroby.dataZakonczenia,
              opisZdarzenia: choroby.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(choroby)
            .innerJoin(konie, eq(choroby.kon, konie.id))
            .where(eq(choroby.id, eventId));
          break;
        case "leczenia":
          events = await db
            .select({
              _id: leczenia.id,
              dataZdarzenia: leczenia.dataZdarzenia,
              weterynarz: weterynarze.imieINazwisko,
              choroba: choroby.opisZdarzenia,
              opisZdarzenia: leczenia.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(leczenia)
            .innerJoin(weterynarze, eq(leczenia.weterynarz, weterynarze.id))
            .innerJoin(choroby, eq(leczenia.choroba, choroby.id))
            .innerJoin(konie, eq(leczenia.kon, konie.id))
            .where(eq(leczenia.id, eventId));
          break;
        case "rozrody":
          events = await db
            .select({
              _id: rozrody.id,
              dataZdarzenia: rozrody.dataZdarzenia,
              weterynarz: weterynarze.imieINazwisko,
              rodzajZdarzenia: rozrody.rodzajZdarzenia,
              opisZdarzenia: rozrody.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(rozrody)
            .innerJoin(weterynarze, eq(rozrody.weterynarz, weterynarze.id))
            .innerJoin(konie, eq(rozrody.kon, konie.id))
            .where(eq(rozrody.id, eventId));
          break;
        case "zdarzenia_profilaktyczne":
          events = await db
            .select({
              _id: zdarzeniaProfilaktyczne.id,
              dataZdarzenia: zdarzeniaProfilaktyczne.dataZdarzenia,
              dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
              weterynarz: weterynarze.imieINazwisko,
              rodzajZdarzenia: zdarzeniaProfilaktyczne.rodzajZdarzenia,
              opisZdarzenia: zdarzeniaProfilaktyczne.opisZdarzenia,
              nazwaKonia: konie.nazwa,
            })
            .from(zdarzeniaProfilaktyczne)
            .innerJoin(konie, eq(zdarzeniaProfilaktyczne.kon, konie.id))
            .innerJoin(
              weterynarze,
              eq(zdarzeniaProfilaktyczne.weterynarz, weterynarze.id)
            )
            .where(eq(zdarzeniaProfilaktyczne.id, eventId));
          break;
        case "podkucie":
          events = await db
            .select({
              _id: podkucia.id,
              dataZdarzenia: podkucia.dataZdarzenia,
              dataWaznosci: podkucia.dataWaznosci,
              kowal: kowale.imieINazwisko,
              nazwaKonia: konie.nazwa,
            })
            .from(podkucia)
            .innerJoin(konie, eq(podkucia.kon, konie.id))
            .innerJoin(kowale, eq(podkucia.kowal, kowale.id))
            .where(eq(podkucia.id, eventId));
          break;
        default:
          return c.json({ error: "Nieznany typ zdarzenia" }, 400);
      }

      return c.json(events, 200);
    } catch (error) {
      console.error("Błąd pobierania wydarzeń:", error);
      return c.json({ error: "Błąd pobierania wydarzeń" }, 500);
    }
  })
  .put(
    "/rozrody/:id{[0-9]+}",
    zValidator("json", rozrodyUpdateSchema),
    async (c) => {
      const eventId = Number(c.req.param("id"));
      const updatedData = c.req.valid("json");

      if (isNaN(eventId)) {
        return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
      }

      try {
        const updateQuery = await db
          .update(rozrody)
          .set(updatedData)
          .where(eq(rozrody.id, eventId))
          .returning();
        if (updateQuery.length === 0) {
          return c.json(
            { error: "Nie znaleziono wydarzenia do aktualizacji" },
            404
          );
        }

        return c.json({ success: true, updatedEvent: updateQuery[0] }, 200);
      } catch (error) {
        console.error("Błąd aktualizacji wydarzenia:", error);
        return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
      }
    }
  )
  .delete("/rozrody/:id{[0-9]+}", async (c) => {
    const eventId = Number(c.req.param("id"));

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      const deleteQuery = await db
        .delete(rozrody)
        .where(eq(rozrody.id, eventId))
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ success: true, deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      console.error("Błąd usuwania wydarzenia:", error);
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  })
  .put(
    "/leczenia/:id{[0-9]+}",
    zValidator("json", leczeniaUpdateSchema),
    async (c) => {
      const eventId = Number(c.req.param("id"));
      const updatedData = c.req.valid("json");

      if (isNaN(eventId)) {
        return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
      }

      try {
        const updateQuery = await db
          .update(leczenia)
          .set(updatedData)
          .where(eq(leczenia.id, eventId))
          .returning();
        if (updateQuery.length === 0) {
          return c.json(
            { error: "Nie znaleziono wydarzenia do aktualizacji" },
            404
          );
        }

        return c.json({ success: true, updatedEvent: updateQuery[0] }, 200);
      } catch (error) {
        console.error("Błąd aktualizacji wydarzenia:", error);
        return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
      }
    }
  )
  .delete("/leczenia/:id{[0-9]+}", async (c) => {
    const eventId = Number(c.req.param("id"));

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      const deleteQuery = await db
        .delete(leczenia)
        .where(eq(leczenia.id, eventId))
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ success: true, deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      console.error("Błąd usuwania wydarzenia:", error);
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  })
  .put(
    "/choroby/:id{[0-9]+}",
    zValidator("json", chorobyUpdateSchema),
    async (c) => {
      const eventId = Number(c.req.param("id"));
      const updatedData = c.req.valid("json");

      if (isNaN(eventId)) {
        return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
      }

      try {
        const updateQuery = await db
          .update(choroby)
          .set(updatedData)
          .where(eq(choroby.id, eventId))
          .returning();
        if (updateQuery.length === 0) {
          return c.json(
            { error: "Nie znaleziono wydarzenia do aktualizacji" },
            404
          );
        }

        return c.json({ success: true, updatedEvent: updateQuery[0] }, 200);
      } catch (error) {
        console.error("Błąd aktualizacji wydarzenia:", error);
        return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
      }
    }
  )
  .delete("/choroby/:id{[0-9]+}", async (c) => {
    const eventId = Number(c.req.param("id"));

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      const deleteQuery = await db
        .delete(choroby)
        .where(eq(choroby.id, eventId))
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ success: true, deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      console.error("Błąd usuwania wydarzenia:", error);
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  })
  .put(
    "/zdarzenia_profilaktyczne/:id{[0-9]+}",
    zValidator("json", zdarzeniaProfilaktyczneUpdateSchema),
    async (c) => {
      const eventId = Number(c.req.param("id"));
      const updatedData = c.req.valid("json");

      if (isNaN(eventId)) {
        return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
      }

      try {
        const updateQuery = await db
          .update(zdarzeniaProfilaktyczne)
          .set(updatedData)
          .where(eq(zdarzeniaProfilaktyczne.id, eventId))
          .returning();
        if (updateQuery.length === 0) {
          return c.json(
            { error: "Nie znaleziono wydarzenia do aktualizacji" },
            404
          );
        }

        return c.json({ success: true, updatedEvent: updateQuery[0] }, 200);
      } catch (error) {
        console.error("Błąd aktualizacji wydarzenia:", error);
        return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
      }
    }
  )
  .delete("/zdarzenia_profilaktyczne/:id{[0-9]+}", async (c) => {
    const eventId = Number(c.req.param("id"));

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      const deleteQuery = await db
        .delete(zdarzeniaProfilaktyczne)
        .where(eq(zdarzeniaProfilaktyczne.id, eventId))
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ success: true, deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      console.error("Błąd usuwania wydarzenia:", error);
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  })
  .put(
    "/podkucie/:id{[0-9]+}",
    zValidator("json", podkuciaUpdateSchema),
    async (c) => {
      const eventId = Number(c.req.param("id"));
      const updatedData = c.req.valid("json");

      if (isNaN(eventId)) {
        return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
      }

      try {
        const updateQuery = await db
          .update(podkucia)
          .set(updatedData)
          .where(eq(podkucia.id, eventId))
          .returning();
        if (updateQuery.length === 0) {
          return c.json(
            { error: "Nie znaleziono wydarzenia do aktualizacji" },
            404
          );
        }

        return c.json({ success: true, updatedEvent: updateQuery[0] }, 200);
      } catch (error) {
        console.error("Błąd aktualizacji wydarzenia:", error);
        return c.json({ error: "Błąd aktualizacji wydarzenia" }, 500);
      }
    }
  )
  .delete("/podkucie/:id{[0-9]+}", async (c) => {
    const eventId = Number(c.req.param("id"));

    if (isNaN(eventId)) {
      return c.json({ error: "Nieprawidłowy identyfikator wydarzenia" }, 400);
    }

    try {
      const deleteQuery = await db
        .delete(podkucia)
        .where(eq(podkucia.id, eventId))
        .returning();

      if (deleteQuery.length === 0) {
        return c.json({ error: "Nie znaleziono wydarzenia do usunięcia" }, 404);
      }

      return c.json({ success: true, deletedEvent: deleteQuery[0] }, 200);
    } catch (error) {
      console.error("Błąd usuwania wydarzenia:", error);
      return c.json({ error: "Błąd usuwania wydarzenia" }, 500);
    }
  });

export default wydarzeniaRoute;
