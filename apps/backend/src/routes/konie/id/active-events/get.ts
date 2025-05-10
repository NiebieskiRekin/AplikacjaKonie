import { Hono } from "hono";
import { getUserFromContext, UserPayload } from "@/backend/middleware/auth";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/backend/db";
import { podkucia, zdarzeniaProfilaktyczne } from "@/backend/db/schema";

export const konie_id_active_events_get = new Hono<{
  Variables: { jwtPayload: UserPayload };
}>().get("/:id{[0-9]+}/active-events", async (c) => {
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
});
