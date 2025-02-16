import { pgTable, pgSchema, unique, check, integer, varchar, date, serial } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const hodowlakoni = pgSchema("hodowlakoni1");
export const rodzajeKoni = hodowlakoni.enum("rodzaje_koni", ['Konie hodowlane', 'Konie rekreacyjne', 'Źrebaki', 'Konie sportowe'])
export const rodzajeZdarzenProfilaktycznych = hodowlakoni.enum("rodzaje_zdarzen_profilaktycznych", ['Odrobaczanie', 'Podanie witamin', 'Szczepienie', 'Dentysta'])
export const rodzajeZdarzenRozrodczych = hodowlakoni.enum("rodzaje_zdarzen_rozrodczych", ['Inseminacja konia', 'Sprawdzenie źrebności', 'Wyźrebienie'])

export const konie = hodowlakoni.table("konie", {
	id: serial("id").primaryKey(),
	numerPrzyzyciowy: varchar("numer_przyzyciowy").notNull().unique(),
	numerChipa: varchar("numer_chipa", { length: 15 }).notNull().unique(),
	rocznikUrodzenia: integer("rocznik_urodzenia"),
	dataPrzybyciaDoStajni: date("data_przybycia_do_stajni").default(sql`CURRENT_DATE`),
	rodzajKonia: rodzajeKoni("rodzaj_konia").notNull(),
	plec: varchar(),
	zdjecieKonia: integer("zdjecie_konia").references(() => zdjeciaKoni.id),
}, () => [
	check("rocznik_urodzenia", sql`(rocznik_urodzenia >= 1950) AND (rocznik_urodzenia <= 2100)`),
]);

export const rozrody = hodowlakoni.table("rozrody", {
	id: serial("id").primaryKey(),
	dataZdarzenia: date("data_zdarzenia").notNull(),
	rodzajZdarzenia: rodzajeZdarzenRozrodczych("rodzaj_zdarzenia").notNull(),
	weterynarz: integer("weterynarz").references(() => weterynarze.id),
});

export const zdjeciaKoni = hodowlakoni.table("zdjecia_koni", {
	id: serial("id").primaryKey(),
	x100: integer().notNull(),
});

export const kowale = hodowlakoni.table("kowale", {
	id: serial("id").primaryKey(),
	imieINazwisko: varchar("imie_i_nazwisko").notNull(),
	numerTelefonu: varchar("numer_telefonu", { length: 15 }) 
},
() => [
	check("rocznik_urodzenia", sql`(rocznik_urodzenia >= 1950) AND (rocznik_urodzenia <= 2100)`),
]);

export const leczenia = hodowlakoni.table("leczenia", {
	id: serial("id").primaryKey(),
	dataZdarzenia: date("data_zdarzenia"),
	opisZdarzenia: varchar("opis_zdarzenia"),
	weterynarz: integer(),
});

export const podkucia = hodowlakoni.table("podkucia", {
	id: serial("id").primaryKey(),
	dataZdarzenia: date("data_zdarzenia"),
	dataWaznosci: date("data_waznosci"),
	kowal: integer(),
});

export const zdarzeniaProfilaktyczne = hodowlakoni.table("zdarzenia_profilaktyczne", {
	id: serial("id").primaryKey(),
	dataZdarzenia: date("data_zdarzenia"),
	dataWaznosci: date("data_waznosci"),
	rodzajZdarzenia: rodzajeZdarzenProfilaktycznychInHodowlakoni("rodzaj_zdarzenia"),
	opisZdarzenia: varchar("opis_zdarzenia"),
});

export const weterynarze = hodowlakoni.table("weterynarze", {
	id: serial("id").primaryKey(),
	imieINazwisko: varchar("imie_i_nazwisko").notNull(),
	numerTelefonu: varchar("numer_telefonu"),
});
