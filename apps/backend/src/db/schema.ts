import {
  pgSchema,
  check,
  integer,
  varchar,
  date,
  customType,
  boolean,
  time,
  text,
  timestamp,
  index,
  uniqueIndex,
  serial,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "@hono/zod-openapi";
import { ProcessEnv } from "../env";

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

const customSchema = pgSchema(ProcessEnv.DATABASE_SCHEMA);
const schemaTable = customSchema.table;
const schemaEnum = customSchema.enum.bind(customSchema);

export const rodzajeKoni = schemaEnum("rodzaje_koni", [
  "Konie hodowlane",
  "Konie rekreacyjne",
  "Źrebaki",
  "Konie sportowe",
]);

export const rodzajeZdarzenProfilaktycznych = schemaEnum(
  "rodzaje_zdarzen_profilaktycznych",
  ["Odrobaczanie", "Podanie suplementów", "Szczepienie", "Dentysta", "Inne"]
);

export const rodzajeZdarzenRozrodczych = schemaEnum(
  "rodzaje_zdarzen_rozrodczych",
  ["Inseminacja konia", "Sprawdzenie źrebności", "Wyźrebienie", "Inne"]
);

export const rodzajeNotifications = schemaEnum("rodzaje_notifications", [
  "Podkucia",
  "Odrobaczanie",
  "Podanie suplementów",
  "Szczepienie",
  "Dentysta",
  "Inne",
]);

export const rodzajeWysylaniaNotifications = schemaEnum(
  "rodzaje_wysylania_notifications",
  ["Push", "Email", "Oba"]
);

export const plcie = schemaEnum("plcie", ["klacz", "ogier", "wałach"]);

export const user = schemaTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = schemaTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = schemaTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = schemaTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const organization = schemaTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    liczba_requestow: integer("liczba_requestow").default(0).notNull(),
    metadata: text("metadata"),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)]
);

export const member = schemaTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ]
);

export const invitation = schemaTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ]
);

export const jwks = schemaTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at"),
});

export const apikey = schemaTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(86400000),
    rateLimitMax: integer("rate_limit_max").default(10),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("apikey_key_idx").on(table.key),
    index("apikey_userId_idx").on(table.userId),
  ]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  apikeys: many(apikey),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
  user: one(user, {
    fields: [apikey.userId],
    references: [user.id],
  }),
}));

export const hodowcyKoniSelectSchema = createSelectSchema(organization);
export const hodowcyKoniUpdateSchema = createUpdateSchema(organization);
export const hodowcyKoniInsertSchema = createInsertSchema(organization);

// TODO: drzewo genealogiczne?
export const konie = schemaTable(
  "konie",
  {
    id: serial("id").primaryKey(),
    nazwa: text("nazwa").notNull(),
    numerPrzyzyciowy: varchar("numer_przyzyciowy", { length: 15 }), // Mogą być null'e, ale też mają być unique
    numerChipa: varchar("numer_chipa", { length: 15 }), // Mogą być null'e, ale też mają być unique
    rocznikUrodzenia: integer("rocznik_urodzenia").default(
      sql`extract(year from now())`
    ),
    dataPrzybyciaDoStajni: date("data_przybycia_do_stajni").defaultNow(),
    dataOdejsciaZeStajni: date("data_odejscia_ze_stajni"),
    hodowla: text("hodowla")
      .notNull()
      .references(() => organization.id),
    rodzajKonia: rodzajeKoni("rodzaj_konia").notNull(),
    plec: plcie("plec"),
    active: boolean("active").notNull().default(true),
  },
  () => [
    check(
      "odejscie_pozniej_niz_przybycie",
      sql`(data_odejscia_ze_stajni is null or data_przybycia_do_stajni is null) or data_przybycia_do_stajni <= data_odejscia_ze_stajni`
    ),
    check(
      "przybycie_nie_wczesniej_niz_rocznik_urodzenia",
      sql`(data_odejscia_ze_stajni is null or data_przybycia_do_stajni is null) or extract(year from data_przybycia_do_stajni) >= rocznik_urodzenia `
    ),
    check(
      "data_przybycia_wymagana_przy_dacie_odejscia",
      sql`not (data_odejscia_ze_stajni is not null and data_przybycia_do_stajni is null)`
    ),
  ]
);

export const konieSelectSchema = createSelectSchema(konie);
export const konieUpdateSchema = createUpdateSchema(konie);
export const konieInsertSchema = createInsertSchema(konie);

export const zdjeciaKoni = schemaTable("zdjecia_koni", {
  id: serial("id").primaryKey(),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  // file: varchar("file").notNull(),
  // width: integer("width").notNull(),
  // height: integer("height").notNull(),
  default: boolean("default").notNull(),
});

export const zdjeciaKoniSelectSchema = createSelectSchema(zdjeciaKoni);
export const zdjeciaKoniUpdateSchema = createUpdateSchema(zdjeciaKoni);
export const zdjeciaKoniInsertSchema = createInsertSchema(zdjeciaKoni);

export const podkucia = schemaTable("podkucia", {
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

export const kowale = schemaTable("kowale", {
  id: serial("id").primaryKey(),
  imieINazwisko: varchar("imie_i_nazwisko").notNull(),
  numerTelefonu: NUMER_TELEFONU,
  hodowla: text("hodowla")
    .notNull()
    .references(() => organization.id),
  active: boolean("active").notNull().default(true),
});

export const kowaleSelectSchema = createSelectSchema(kowale);
export const kowaleUpdateSchema = createUpdateSchema(kowale);
export const kowaleInsertSchema = createInsertSchema(kowale);

export const choroby = schemaTable("choroby", {
  id: serial("id").primaryKey(),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  dataRozpoczecia: date("data_rozpoczecia").notNull().defaultNow(),
  dataZakonczenia: date("data_zakonczenia"),
  opisZdarzenia: varchar("opis_zdarzenia"),
});

export const chorobySelectSchema = createSelectSchema(choroby);
export const chorobyUpdateSchema = createUpdateSchema(choroby);
export const chorobyInsertSchema = createInsertSchema(choroby);

// TODO: zastanów się nad złożonym primary_key(id,kon)
// TODO: grupowanie zdarzeń?
export const leczenia = schemaTable("leczenia", {
  id: serial("id").primaryKey(),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  weterynarz: integer("weterynarz")
    .notNull()
    .references(() => weterynarze.id),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  opisZdarzenia: varchar("opis_zdarzenia"),
  choroba: integer("choroba").references(() => choroby.id),
});

export const leczeniaSelectSchema = createSelectSchema(leczenia);
export const leczeniaUpdateSchema = createUpdateSchema(leczenia);
export const leczeniaInsertSchema = createInsertSchema(leczenia);

// TODO: zastanów się nad złożonym primary_key(id,kon)
// TODO: uwzględnienie potomstwa
// TODO: uwzględnienie rodziców
export const rozrody = schemaTable("rozrody", {
  id: serial("id").primaryKey(),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  weterynarz: integer("weterynarz")
    .notNull()
    .references(() => weterynarze.id),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  rodzajZdarzenia: rodzajeZdarzenRozrodczych("rodzaj_zdarzenia").notNull(),
  opisZdarzenia: text("opis_zdarzenia"),
});

export const rozrodySelectSchema = createSelectSchema(rozrody);
export const rozrodyUpdateSchema = createUpdateSchema(rozrody);
export const rozrodyInsertSchema = createInsertSchema(rozrody);

// TODO: zastanów się nad złożonym primary_key(id,kon)
// TODO: grupowanie zdarzeń?
export const zdarzeniaProfilaktyczne = schemaTable("zdarzenia_profilaktyczne", {
  id: serial("id").primaryKey(),
  kon: integer("kon")
    .notNull()
    .references(() => konie.id),
  weterynarz: integer("weterynarz")
    .notNull()
    .references(() => weterynarze.id),
  dataZdarzenia: date("data_zdarzenia").notNull().defaultNow(),
  dataWaznosci: date("data_waznosci"),
  rodzajZdarzenia: rodzajeZdarzenProfilaktycznych("rodzaj_zdarzenia").notNull(),
  opisZdarzenia: text("opis_zdarzenia"),
});

export const zdarzeniaProfilaktyczneSelectSchema = createSelectSchema(
  zdarzeniaProfilaktyczne
);
export const zdarzeniaProfilaktyczneUpdateSchema = createUpdateSchema(
  zdarzeniaProfilaktyczne
);
export const zdarzeniaProfilaktyczneInsertSchema = createInsertSchema(
  zdarzeniaProfilaktyczne
);

export const weterynarze = schemaTable("weterynarze", {
  id: serial("id").primaryKey(),
  imieINazwisko: text("imie_i_nazwisko").notNull(),
  numerTelefonu: NUMER_TELEFONU,
  hodowla: text("hodowla")
    .notNull()
    .references(() => organization.id),
  active: boolean("active").notNull().default(true),
});

export const weterynarzeSelectSchema = createSelectSchema(weterynarze);
export const weterynarzeUpdateSchema = createUpdateSchema(weterynarze);
export const weterynarzeInsertSchema = createInsertSchema(weterynarze);

export const usersSelectSchema = createSelectSchema(user);
export const usersInsertSchema = createInsertSchema(user).extend({
  createdAt: z.optional(z.iso.date()),
  refreshTokenVersion: z.optional(z.number()),
});
export const usersUpdateSchema = createUpdateSchema(user);

// tabelka z preferencji użytkownika dot. powiadomień
export const notifications = schemaTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  rodzajZdarzenia: rodzajeNotifications("rodzaje_notifications").notNull(),
  days: integer("days").notNull(),
  time: time({ precision: 6, withTimezone: true }).notNull(),
  active: boolean("active").notNull().default(true),
  rodzajWysylania: rodzajeWysylaniaNotifications(
    "rodzaje_wysylania_notifications"
  ).notNull(),
});

export const notificationsSelectSchema = createSelectSchema(notifications);
export const notificationsUpdateSchema = createUpdateSchema(notifications);
export const notificationsInsertSchema = createInsertSchema(notifications);
