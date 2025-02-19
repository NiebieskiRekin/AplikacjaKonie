import {
  pgSchema,
  pgTable,
  check,
  integer,
  varchar,
  date,
  serial,
  uuid,
  customType,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const NUMER_TELEFONU = varchar("numer_telefonu", { length: 15 });
// const NUMER_TELEFONU_CHECK = check(
//   "numer_telefonu",
//   sql`regexp_like(numer_telefonu,'[\s\d+-]*','gi')`
// );

export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const hodowcyKoni = pgTable("hodowcy_koni", {
  id: serial("id").primaryKey(),
  nazwa: varchar("nazwa"),
  numer_telefonu: NUMER_TELEFONU.notNull(),
  email: varchar("email").notNull(),
  schema: varchar("schema"),
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
  ["Odrobaczanie", "Podanie suplementów", "Szczepienie", "Dentysta", "Inne"]
);

export const rodzajeZdarzenRozrodczych = hodowlakoni.enum(
  "rodzaje_zdarzen_rozrodczych",
  ["Inseminacja konia", "Sprawdzenie źrebności", "Wyźrebienie", "Inne"]
);

export const plcie = hodowlakoni.enum("plcie", ["samiec", "samica"]);

// TODO: drzewo genealogiczne?
export const konie = hodowlakoni.table(
  "konie",
  {
    id: serial("id").primaryKey(),
    numerPrzyzyciowy: varchar("numer_przyzyciowy", { length: 15 })
      .notNull()
      .unique(),
    numerChipa: varchar("numer_chipa", { length: 15 }).notNull().unique(),
    rocznikUrodzenia: integer("rocznik_urodzenia").default(
      sql`extract(year from CURRENT_DATE)`
    ),
    dataPrzybyciaDoStajni: date("data_przybycia_do_stajni").defaultNow(),
    dataOdejsciaZeStajni: date("data_odejscia_ze_stajni"),
    rodzajKonia: rodzajeKoni("rodzaj_konia").notNull(),
    plec: plcie("plec"),
  },
  () => [
    check(
      "odejscie_pozniej_niz_przybycie",
      sql`(data_odejscia_ze_stajni is null and data_przybycia_do_stajni is null) or data_przybycia_do_stajni < data_odejscia_ze_stajni`
    ),
  ]
);

export const konieRelations = relations(konie, ({ many }) => ({
  zdjeciaKoni: many(zdjeciaKoni),
  choroby: many(choroby),
  rozrody: many(rozrody),
  leczenia: many(leczenia),
  zdarzeniaProfilaktyczne: many(zdarzeniaProfilaktyczne),
  podkucia: many(podkucia),
}));

// NOTE: UUID jako primary key, aby ułatwić caching i ewentualną migrację do S3
export const zdjeciaKoni = hodowlakoni.table("zdjecia_koni", {
  id: uuid("id").primaryKey(),
  kon: integer("kon").references(() => konie.id),
  file: uuid("file")
    .notNull()
    .references(() => files.id),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
});

export const zdjeciaKoniRelations = relations(zdjeciaKoni, ({ one }) => ({
  kon: one(konie, {
    fields: [zdjeciaKoni.kon],
    references: [konie.id],
  }),
  file: one(files, {
    fields: [zdjeciaKoni.file],
    references: [files.id],
  }),
}));

export const files = hodowlakoni.table("files", {
  id: uuid("id").primaryKey(),
  filename: varchar("filename").notNull(),
  mimetype: varchar("mimetype").notNull(),
  data: bytea("data").notNull(),
});

export const podkucia = hodowlakoni.table("podkucia", {
  id: serial("id").primaryKey(),
  dataZdarzenia: date("data_zdarzenia"),
  dataWaznosci: date("data_waznosci"),
  kon: integer("kon").references(() => konie.id),
  kowal: integer("kowal").references(() => kowale.id),
});

export const podkuciaRelations = relations(podkucia, ({ one }) => ({
  kowal: one(kowale, {
    fields: [podkucia.kowal],
    references: [kowale.id],
  }),
  kon: one(konie, {
    fields: [podkucia.kon],
    references: [konie.id],
  }),
}));

export const kowale = hodowlakoni.table("kowale", {
  id: serial("id").primaryKey(),
  imieINazwisko: varchar("imie_i_nazwisko").notNull(),
  numerTelefonu: NUMER_TELEFONU,
});

export const kowaleRelations = relations(kowale, ({ many }) => ({
  podkucia: many(podkucia),
}));

export const choroby = hodowlakoni.table("choroby", {
  id: serial("id").primaryKey(),
  kon: integer("kon").references(() => konie.id),
  dataRozpoczecia: date("data_rozpoczecia").notNull().defaultNow(),
  dataZakonczenia: date("data_zakonczenia"),
  opisZdarzenia: varchar("opis_zdarzenia").notNull(),
});

export const chorobyRelations = relations(choroby, ({ one }) => ({
  kon: one(konie, {
    fields: [choroby.kon],
    references: [konie.id],
  }),
}));

// TODO: zastanów się nad złożonym primary_key(id,kon)
// TODO: grupowanie zdarzeń?
export const leczenia = hodowlakoni.table("leczenia", {
  id: serial("id").primaryKey(),
  kon: integer("kon").references(() => konie.id),
  weterynarz: integer("weterynarz").references(() => weterynarze.id),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  opisZdarzenia: varchar("opis_zdarzenia").notNull(),
});

export const leczeniaRelations = relations(leczenia, ({ one }) => ({
  kon: one(konie, {
    fields: [leczenia.kon],
    references: [konie.id],
  }),
  weterynarz: one(weterynarze, {
    fields: [leczenia.weterynarz],
    references: [weterynarze.id],
  }),
}));

// TODO: zastanów się nad złożonym primary_key(id,kon)
// TODO: uwzględnienie potomstwa
// TODO: uwzględnienie rodziców
export const rozrody = hodowlakoni.table("rozrody", {
  id: serial("id").primaryKey(),
  kon: integer("kon").references(() => konie.id),
  weterynarz: integer("weterynarz").references(() => weterynarze.id),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  rodzajZdarzenia: rodzajeZdarzenRozrodczych("rodzaj_zdarzenia").notNull(),
  opisZdarzenia: varchar("opis_zdarzenia").notNull(),
});

export const rozrodyRelations = relations(rozrody, ({ one }) => ({
  kon: one(konie, {
    fields: [rozrody.kon],
    references: [konie.id],
  }),
  weterynarz: one(weterynarze, {
    fields: [rozrody.weterynarz],
    references: [weterynarze.id],
  }),
}));

// TODO: zastanów się nad złożonym primary_key(id,kon)
// TODO: grupowanie zdarzeń?
export const zdarzeniaProfilaktyczne = hodowlakoni.table(
  "zdarzenia_profilaktyczne",
  {
    id: serial("id").primaryKey(),
    kon: integer("kon").references(() => konie.id),
    weterynarz: integer("weterynarz").references(() => weterynarze.id),
    dataZdarzenia: date("data_zdarzenia").defaultNow(),
    dataWaznosci: date("data_waznosci"),
    rodzajZdarzenia:
      rodzajeZdarzenProfilaktycznych("rodzaj_zdarzenia").notNull(),
    opisZdarzenia: varchar("opis_zdarzenia"),
  }
);

export const zdarzeniaProfilaktyczneRelations = relations(
  zdarzeniaProfilaktyczne,
  ({ one }) => ({
    kon: one(konie, {
      fields: [zdarzeniaProfilaktyczne.kon],
      references: [konie.id],
    }),
    weterynarz: one(weterynarze, {
      fields: [zdarzeniaProfilaktyczne.weterynarz],
      references: [weterynarze.id],
    }),
  })
);

export const weterynarze = hodowlakoni.table("weterynarze", {
  id: serial("id").primaryKey(),
  imieINazwisko: varchar("imie_i_nazwisko").notNull(),
  numerTelefonu: NUMER_TELEFONU,
});

export const weterynarzeRelations = relations(weterynarze, ({ many }) => ({
  rozrody: many(rozrody),
  leczenia: many(leczenia),
  zdarzeniaProfilaktyczne: many(zdarzeniaProfilaktyczne),
}));
