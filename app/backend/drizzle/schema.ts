import {
  pgTable,
  pgSchema,
  unique,
  check,
  integer,
  varchar,
  date,
  serial,
  customType,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const NUMER_TELEFONU = varchar("numer_telefonu", { length: 15 });
const NUMER_TELEFONU_CHECK = check(
  "numer_telefonu",
  sql`regexp_like(numer_telefonu,'[\s\d+-]*','gi')`
);

const binary = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const hodowlakoni = pgSchema("hodowlakoni1");
export const rodzajeKoni = hodowlakoni.enum("rodzaje_koni", [
  "Konie hodowlane",
  "Konie rekreacyjne",
  "Źrebaki",
  "Konie sportowe",
]);
export const rodzajeZdarzenProfilaktycznych = hodowlakoni.enum(
  "rodzaje_zdarzen_profilaktycznych",
  ["Odrobaczanie", "Podanie witamin", "Szczepienie", "Dentysta"]
);
export const rodzajeZdarzenRozrodczych = hodowlakoni.enum(
  "rodzaje_zdarzen_rozrodczych",
  ["Inseminacja konia", "Sprawdzenie źrebności", "Wyźrebienie"]
);

export const konie = hodowlakoni.table(
  "konie",
  {
    id: serial("id").primaryKey(),
    numerPrzyzyciowy: varchar("numer_przyzyciowy").notNull().unique(),
    numerChipa: varchar("numer_chipa", { length: 15 }).notNull().unique(),
    rocznikUrodzenia: integer("rocznik_urodzenia").default(sql`extract(year from CURRENT_DATE)`),
    dataPrzybyciaDoStajni: date("data_przybycia_do_stajni").defaultNow(),
    rodzajKonia: rodzajeKoni("rodzaj_konia").notNull(),
    plec: varchar(),
    zdjecieKonia: integer("zdjecie_konia").references(() => zdjeciaKoni.id),
  },
  () => [
    check(
      "rocznik_urodzenia",
      sql`(rocznik_urodzenia >= 1950) AND (rocznik_urodzenia <= 2100)`
    ),
  ]
);



export const zdjeciaKoni = hodowlakoni.table("zdjecia_koni", {
  id: serial("id").primaryKey(),
  x100: binary(),
  x1000: binary(),
});




export const podkucia = hodowlakoni.table("podkucia", {
  id: serial("id").primaryKey(),
  dataZdarzenia: date("data_zdarzenia"),
  dataWaznosci: date("data_waznosci"),
  kowal: integer("kowal"),
});

export const podkuciaRelations = relations(podkucia, ({ one }) => ({
  kowal: one(kowale, {
    fields: [podkucia.kowal],
    references: [kowale.id],
  }),
}));

export const kowale = hodowlakoni.table(
  "kowale",
  {
    id: serial("id").primaryKey(),
    imieINazwisko: varchar("imie_i_nazwisko").notNull(),
    numerTelefonu: NUMER_TELEFONU,
  },
  () => [NUMER_TELEFONU_CHECK]
);

export const kowaleRelations = relations(kowale, ({ many }) => ({
  podkucia: many(podkucia),
}));




export const leczenia = hodowlakoni.table("leczenia", {
  id: serial("id").primaryKey(),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  opisZdarzenia: varchar("opis_zdarzenia").notNull(),
  weterynarz: integer("weterynarz"),
});

export const rozrody = hodowlakoni.table("rozrody", {
  id: serial("id").primaryKey(),
  dataZdarzenia: date("data_zdarzenia").notNull(),
  rodzajZdarzenia: rodzajeZdarzenRozrodczych("rodzaj_zdarzenia").notNull(),
  weterynarz: integer("weterynarz"),
  opisZdarzenia: varchar("opis_zdarzenia"),
});

export const zdarzeniaProfilaktyczne = hodowlakoni.table(
  "zdarzenia_profilaktyczne",
  {
    id: serial("id").primaryKey(),
    dataZdarzenia: date("data_zdarzenia"),
    dataWaznosci: date("data_waznosci"),
    rodzajZdarzenia: rodzajeZdarzenProfilaktycznych("rodzaj_zdarzenia"),
    opisZdarzenia: varchar("opis_zdarzenia"),
  }
);

export const weterynarze = hodowlakoni.table(
  "weterynarze",
  {
    id: serial("id").primaryKey(),
    imieINazwisko: varchar("imie_i_nazwisko").notNull(),
    numerTelefonu: NUMER_TELEFONU,
  },
  () => [NUMER_TELEFONU_CHECK]
);
