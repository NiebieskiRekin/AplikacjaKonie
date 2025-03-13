import { db } from "../db";
import { and, eq, lte, gte, sql, or } from "drizzle-orm";
import { notifications, podkucia, konie, users, zdarzeniaProfilaktyczne } from "../db/schema";


export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

/**
 * Pobiera wydarzenia użytkownika na podstawie ustawień powiadomień
 */
export async function fetchUserEvents() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentHour = now.getHours().toString().padStart(2, "0") + ":00";

  const _notifications = await db
    .select()
    .from(notifications)
    .where(or(eq(notifications.rodzajWysylania, "Email"), eq(notifications.rodzajWysylania, "Oba")));

  const userNotifications: Record<string, { rodzajKonia: string; wydarzenia: Record<string, string[]> }> = {};

  for (const setting of _notifications) {
    const { userId, rodzajZdarzenia } = setting;
    let events = [];

    const hodowla = await db
      .select({ hodowlaId: users.hodowla })
      .from(users)
      .where(eq(users.id, userId))
      .then((res) => res[0]);

    if (rodzajZdarzenia === "Podkucia") {
      events = await db
        .select({
          id: podkucia.id,
          dataWaznosci: podkucia.dataWaznosci,
          rodzajZdarzenia: sql<string>`'Podkucia'`.as("rodzajZdarzenia"),
          nazwaKonia: konie.nazwa,
          rodzajKonia: konie.rodzajKonia,
          email: users.email,
        })
        .from(podkucia)
        .innerJoin(konie, eq(podkucia.kon, konie.id))
        .innerJoin(users, eq(konie.hodowla, users.hodowla))
        .where(
          and(
            eq(konie.hodowla, hodowla.hodowlaId),
            lte(podkucia.dataWaznosci, addDays(today, Number(setting.days))),
            gte(sql`${setting.time}`, currentHour)
          )
        );
    } else {
      events = await db
        .select({
          id: zdarzeniaProfilaktyczne.id,
          dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
          rodzajZdarzenia: zdarzeniaProfilaktyczne.rodzajZdarzenia,
          nazwaKonia: konie.nazwa,
          rodzajKonia: konie.rodzajKonia,
          email: users.email,
        })
        .from(zdarzeniaProfilaktyczne)
        .innerJoin(konie, eq(zdarzeniaProfilaktyczne.kon, konie.id))
        .innerJoin(users, eq(konie.hodowla, users.hodowla))
        .where(
          and(
            eq(zdarzeniaProfilaktyczne.rodzajZdarzenia, rodzajZdarzenia),
            eq(konie.hodowla, hodowla.hodowlaId),
            lte(zdarzeniaProfilaktyczne.dataWaznosci, addDays(today, Number(setting.days))),
            gte(notifications.time, currentHour)
          )
        );
    }

    // Grupowanie zdarzeń dla użytkownika
    for (const event of events) {
      if (!userNotifications[event.email]) {
        userNotifications[event.email] = { rodzajKonia: event.rodzajKonia, wydarzenia: {} };
      }

      if (!userNotifications[event.email].wydarzenia[event.rodzajZdarzenia]) {
        userNotifications[event.email].wydarzenia[event.rodzajZdarzenia] = [];
      }

      userNotifications[event.email].wydarzenia[event.rodzajZdarzenia].push(event.nazwaKonia);
    }
  }

  return userNotifications;
}
