import { db } from "../db";
import { and, eq, gte, sql, or, isNull, isNotNull, lte } from "drizzle-orm";
import {
  notifications,
  podkucia,
  konie,
  users,
  zdarzeniaProfilaktyczne,
} from "../db/schema";

/**
 * Pobiera wydarzenia użytkownika na podstawie ustawień powiadomień
 */
export async function fetchUserEvents() {
  const n1 = db
    .select({
      userId: users.id,
      hodowlaId: users.hodowla,
      rodzajZdarzenia: notifications.rodzajZdarzenia,
      rodzajWysylania: notifications.rodzajWysylania,
      time: notifications.time,
      days: notifications.days,
      email: users.email,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.userId, users.id))
    .where(
      or(
        eq(notifications.rodzajWysylania, sql`'Email'`),
        eq(notifications.rodzajWysylania, sql`'Oba'`),
        eq(notifications.active, true)
      )
    );

  const _notifications = db.$with("users_notifications").as(n1);

  const e1 = db
    .select({
      id: podkucia.id,
      dataWaznosci: podkucia.dataWaznosci,
      rodzajZdarzenia: sql<string>`'Podkucia'`.as("rodzaj_zdarzenia"),
      kon: podkucia.kon,
    })
    .from(podkucia)
    .union(
      db
        .select({
          id: zdarzeniaProfilaktyczne.id,
          dataWaznosci: zdarzeniaProfilaktyczne.dataWaznosci,
          rodzajZdarzenia: sql<string>`${zdarzeniaProfilaktyczne.rodzajZdarzenia}::TEXT`,
          kon: zdarzeniaProfilaktyczne.kon,
        })
        .from(zdarzeniaProfilaktyczne)
    );

  // Consider adding another table, ekhm message queue, to handle missing/late sends due to outages
  const _events = db.$with("events").as(e1);

  const _upcoming_events = await db
    .with(_events, _notifications)
    .selectDistinct({
      id: _events.id,
      dataWaznosci: _events.dataWaznosci,
      rodzajZdarzenia: _events.rodzajZdarzenia,
      nazwaKonia: konie.nazwa,
      rodzajKonia: konie.rodzajKonia,
      email: _notifications.email,
    })
    .from(_events)
    .innerJoin(konie, eq(_events.kon, konie.id))
    .innerJoin(
      _notifications,
      and(
        eq(konie.hodowla, _notifications.hodowlaId),
        eq(
          _events.rodzajZdarzenia,
          sql`${_notifications.rodzajZdarzenia}::TEXT`
        )
      )
    )
    .where(
      and(
        or(
          gte(
            sql`CURRENT_DATE`,
            sql`${_events.dataWaznosci} - ${_notifications.days}`
          ),
          lte(_events.dataWaznosci, sql`CURRENT_DATE`)
        ),
        eq(
          sql`${_notifications.time} AT TIME ZONE 'UTC'`,
          sql`DATE_TRUNC('hour',CURRENT_TIMESTAMP)::timetz AT TIME ZONE 'UTC'`
        ),
        isNull(konie.dataOdejsciaZeStajni),
        isNotNull(_events.dataWaznosci)
      )
    )
    .orderBy(konie.nazwa, _events.dataWaznosci);

  const userNotifications: Record<
    string,
    {
      wydarzenia: Record<
        string,
        { nazwaKonia: string; rodzajKonia: string; dataWaznosci: string }[]
      >;
    }
  > = {};

  for (const event of _upcoming_events) {
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

  return userNotifications;
}
