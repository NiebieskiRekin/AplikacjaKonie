import {
  pgSchema,
  check,
  integer,
  varchar,
  date,
  serial,
  uuid,
  customType,
  boolean,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

const NUMER_TELEFONU = varchar("numer_telefonu", { length: 15 });
// const NUMER_TELEFONU_CHECK_DRIZZLE = check(
//   "numer_telefonu",
//   sql`regexp_like(numer_telefonu,'[\s\d+-]*','gi')`
// );
// const NUMER_TELEFONU_CHECK_ZOD = z.string().max(15).regex(RegExp('[\s\d+-]*',"gi"),{message: "Należy podać poprawny numer telefonu"})

export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const hodowlakoni = pgSchema("hodowlakoni");

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

export const hodowcyKoni = hodowlakoni.table("hodowcy_koni", {
  id: serial("id").primaryKey(),
  nazwa: varchar("nazwa").notNull(),
  email: varchar("email").notNull(),
  numer_telefonu: NUMER_TELEFONU,
});

export const hodowcyKoniSelectSchema = createSelectSchema(hodowcyKoni);
export const hodowcyKoniUpdateSchema = createUpdateSchema(hodowcyKoni);
export const hodowcyKoniInsertSchema = createInsertSchema(hodowcyKoni);

export const hodowcyKoniRelations = relations(hodowcyKoni, ({ many }) => ({
  konie: many(konie),
  kowale: many(kowale),
  weterynarze: many(weterynarze),
}));

// TODO: drzewo genealogiczne?
export const konie = hodowlakoni.table(
  "konie",
  {
    id: serial("id").primaryKey(),
    nazwa: varchar("nazwa").notNull(),
    numerPrzyzyciowy: varchar("numer_przyzyciowy", { length: 15 })
      .notNull()
      .unique(),
    numerChipa: varchar("numer_chipa", { length: 15 }).notNull().unique(),
    rocznikUrodzenia: integer("rocznik_urodzenia").default(
      sql`extract(year from CURRENT_DATE)`
    ),
    dataPrzybyciaDoStajni: date("data_przybycia_do_stajni").defaultNow(),
    dataOdejsciaZeStajni: date("data_odejscia_ze_stajni"),
    hodowla: integer("hodowla")
      .notNull()
      .references(() => hodowcyKoni.id),
    rodzajKonia: rodzajeKoni("rodzaj_konia").notNull(),
    plec: plcie("plec"),
  },
  () => [
    check(
      "odejscie_pozniej_niz_przybycie",
      sql`(data_odejscia_ze_stajni is null or data_przybycia_do_stajni is null) or data_przybycia_do_stajni < data_odejscia_ze_stajni`
    ),
    check(
      "przybycie_nie_wczesniej_niz_rocznik_urodzenia",
      sql`(data_odejscia_ze_stajni is null or data_przybycia_do_stajni is null) or extract(year from data_przybycia_do_stajni) >= rocznik_urodzenia `
    ),
    check(
      "data_przybycia_wymagana_przy_dacie_odejscia",
      sql`not (data_odejscia_ze_stajni is not null and data_przybycia_do_stajni is null)`
    )
  ]
);

export const konieSelectSchema = createSelectSchema(konie);
export const konieUpdateSchema = createUpdateSchema(konie);
export const konieInsertSchema = createInsertSchema(konie, {hodowla: z.number().optional()});

export const konieRelations = relations(konie, ({ many, one }) => ({
  zdjeciaKoni: many(zdjeciaKoni),
  choroby: many(choroby),
  rozrody: many(rozrody),
  leczenia: many(leczenia),
  zdarzeniaProfilaktyczne: many(zdarzeniaProfilaktyczne),
  podkucia: many(podkucia),
  hodowla: one(hodowcyKoni, {
    fields: [konie.hodowla],
    references: [hodowcyKoni.id],
  }),
}));

// NOTE: UUID jako primary key, aby ułatwić caching i ewentualną migrację do S3
export const zdjeciaKoni = hodowlakoni.table("zdjecia_koni", {
  id: uuid("id").primaryKey(),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  file: uuid("file")
    .notNull()
    .references(() => files.id),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  default: boolean("default").notNull(),
});

export const zdjeciaKoniSelectSchema = createSelectSchema(zdjeciaKoni);
export const zdjeciaKoniUpdateSchema = createUpdateSchema(zdjeciaKoni);
export const zdjeciaKoniInsertSchema = createInsertSchema(zdjeciaKoni);

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

export const filesSelectSchema = createSelectSchema(files);
export const filesUpdateSchema = createUpdateSchema(files);
export const filesInsertSchema = createInsertSchema(files);

export const filesRelations = relations(files, ({ many }) => ({
  zdjeciaKoni: many(zdjeciaKoni),
}));

export const podkucia = hodowlakoni.table("podkucia", {
  id: serial("id").primaryKey(),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  dataWaznosci: date("data_waznosci"),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  kowal: integer("kowal")
    .notNull()
    .references(() => kowale.id),
});

export const podkuciaSelectSchema = createSelectSchema(podkucia);
export const podkuciaUpdateSchema = createUpdateSchema(podkucia);
export const podkuciaInsertSchema = createInsertSchema(podkucia);

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
  hodowla: integer("hodowla")
    .notNull()
    .references(() => hodowcyKoni.id),
});

export const kowaleSelectSchema = createSelectSchema(kowale);
export const kowaleUpdateSchema = createUpdateSchema(kowale);
export const kowaleInsertSchema = createInsertSchema(kowale);

export const kowaleRelations = relations(kowale, ({ many, one }) => ({
  podkucia: many(podkucia),
  hodowla: one(hodowcyKoni, {
    fields: [kowale.hodowla],
    references: [hodowcyKoni.id],
  }),
}));

export const choroby = hodowlakoni.table("choroby", {
  id: serial("id").primaryKey(),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  dataRozpoczecia: date("data_rozpoczecia").notNull().defaultNow(),
  dataZakonczenia: date("data_zakonczenia"),
  opisZdarzenia: varchar("opis_zdarzenia").notNull(),
});

export const chorobySelectSchema = createSelectSchema(choroby);
export const chorobyUpdateSchema = createUpdateSchema(choroby);
export const chorobyInsertSchema = createInsertSchema(choroby);

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
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  weterynarz: integer("weterynarz")
    .notNull()
    .references(() => weterynarze.id),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  opisZdarzenia: varchar("opis_zdarzenia").notNull(),
});

export const leczeniaSelectSchema = createSelectSchema(leczenia);
export const leczeniaUpdateSchema = createUpdateSchema(leczenia);
export const leczeniaInsertSchema = createInsertSchema(leczenia);

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
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  weterynarz: integer("weterynarz")
    .notNull()
    .references(() => weterynarze.id),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  rodzajZdarzenia: rodzajeZdarzenRozrodczych("rodzaj_zdarzenia").notNull(),
  opisZdarzenia: varchar("opis_zdarzenia").notNull(),
});

export const rozrodySelectSchema = createSelectSchema(rozrody);
export const rozrodyUpdateSchema = createUpdateSchema(rozrody);
export const rozrodyInsertSchema = createInsertSchema(rozrody);

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
    kon: integer("kon")
      .notNull()
      .references(() => konie.id),
    weterynarz: integer("weterynarz")
      .notNull()
      .references(() => weterynarze.id),
    dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
    dataWaznosci: date("data_waznosci"),
    rodzajZdarzenia:
      rodzajeZdarzenProfilaktycznych("rodzaj_zdarzenia").notNull(),
    opisZdarzenia: varchar("opis_zdarzenia").notNull(),
  }
);

export const zdarzeniaProfilaktyczneSelectSchema = createSelectSchema(
  zdarzeniaProfilaktyczne
);
export const zdarzeniaProfilaktyczneUpdateSchema = createUpdateSchema(
  zdarzeniaProfilaktyczne
);
export const zdarzeniaProfilaktyczneInsertSchema = createInsertSchema(
  zdarzeniaProfilaktyczne
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
  hodowla: integer("hodowla")
    .notNull()
    .references(() => hodowcyKoni.id),
});

export const weterynarzeSelectSchema = createSelectSchema(weterynarze);
export const weterynarzeUpdateSchema = createUpdateSchema(weterynarze);
export const weterynarzeInsertSchema = createInsertSchema(weterynarze);

export const weterynarzeRelations = relations(weterynarze, ({ many, one }) => ({
  rozrody: many(rozrody),
  leczenia: many(leczenia),
  zdarzeniaProfilaktyczne: many(zdarzeniaProfilaktyczne),
  hodowla: one(hodowcyKoni, {
    fields: [weterynarze.hodowla],
    references: [hodowcyKoni.id],
  }),
}));


// Role użytkowników (do zmiany pewnie zależne od Adama);
export const userRolesEnum = hodowlakoni.enum("user_roles", [
  "właściciel",
  "członek",
  "viewer",
]);

export const users = hodowlakoni.table("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", {length: 255}).notNull().unique(),
  password: varchar("password", {length: 255}).notNull(),
  hodowla: integer("hodowla").notNull().references(() => hodowcyKoni.id), // do konkretnego zioma (można podmimenić tamto wyżej i też jako tako będzie)
  createdAt: date("created_at").defaultNow(),

});

export const usersSelectSchema = createSelectSchema(users);
export const usersInsertSchema = createInsertSchema(users);
export const usersUpdateSchema = createUpdateSchema(users);

// Tabela łącząca użytkowników z uprawnieniami;
// TODO: chyba warto będzie to uprościć do jednej tabeli Users
export const user_permissions = hodowlakoni.table("user_permissions", {
  userId: integer("user_id").notNull().references(() => users.id),
  role: userRolesEnum("role").notNull(),
});

export const userPermissionsSelectSchema = createSelectSchema(user_permissions);
export const userPermissionsInsertSchema = createInsertSchema(user_permissions);
export const userPermissionsUpdateSchema = createUpdateSchema(user_permissions);

// Realcja dla tabeli użytkowników
export const usersRelations = relations(users, ({ one }) => ({
  // Relacja do hodowli (hodowcyKoni)
  hodowla: one(hodowcyKoni, {
    fields: [users.hodowla],
    references: [hodowcyKoni.id],
  }),
  // Relacja do uprawnień
  permissions: one(user_permissions),
}));