import { db } from "../db";
import { and, eq, gte, sql, or, isNull, isNotNull, lte } from "drizzle-orm";
import { notifications, podkucia, konie, users, zdarzeniaProfilaktyczne } from "../db/schema";


export function subtractDays(dateStr: string, days: number): string {
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
    .select({
      userId: users.id,
      hodowlaId: users.hodowla,
      rodzajZdarzenia: notifications.rodzajZdarzenia,
      rodzajWysylania: notifications.rodzajWysylania,
      time: notifications.time,
      days: notifications.days,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .where(or(eq(notifications.rodzajWysylania, "Email"), eq(notifications.rodzajWysylania, "Oba")));

    const userNotifications: Record<
    string,
    {
      wydarzenia: Record<string, { nazwaKonia: string; rodzajKonia: string; dataWaznosci: string }[]>;
    }
  > = {};
// Tutaj na pewno jest do pomyślenia, żeby to zoptymalizować, 
// jak mi zaczeło działać to nie chciałem w tym grzebać, bo trochę z tym się bawiłem...
  for (const setting of _notifications) {
    const { rodzajZdarzenia, hodowlaId } = setting;
    let events = [];

    if (rodzajZdarzenia === "Podkucia") {
      events = await db
        .selectDistinct({
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
            eq(konie.hodowla, hodowlaId),
            or(
              gte(podkucia.dataWaznosci, subtractDays(today, Number(setting.days))),
              lte(podkucia.dataWaznosci, today)
            ),
            gte(sql`${setting.time}`, currentHour),
            isNull(konie.dataOdejsciaZeStajni),
            isNotNull(podkucia.dataWaznosci),
          )
        )
        .orderBy(konie.nazwa, podkucia.dataWaznosci);
    } else {
      events = await db
        .selectDistinct({
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
            eq(konie.hodowla, hodowlaId),
            or(
              gte(zdarzeniaProfilaktyczne.dataWaznosci, subtractDays(today, Number(setting.days))),
              lte(zdarzeniaProfilaktyczne.dataWaznosci, today)
            ),
            gte(sql`${setting.time}`, currentHour),
            isNull(konie.dataOdejsciaZeStajni),
            isNotNull(zdarzeniaProfilaktyczne.dataWaznosci),
          )
        )
        .orderBy(konie.nazwa, zdarzeniaProfilaktyczne.dataWaznosci);
    }

    for (const event of events) {
      if (!userNotifications[event.email]) {
        userNotifications[event.email] = { wydarzenia: {} };
      }

      if (!userNotifications[event.email].wydarzenia[event.rodzajZdarzenia]) {
        userNotifications[event.email].wydarzenia[event.rodzajZdarzenia] = [];
      }

      userNotifications[event.email].wydarzenia[event.rodzajZdarzenia].push({
        nazwaKonia: event.nazwaKonia,
        rodzajKonia: event.rodzajKonia,
        dataWaznosci: event.dataWaznosci ?? "",
      });
    }
  }

  return userNotifications;
}
