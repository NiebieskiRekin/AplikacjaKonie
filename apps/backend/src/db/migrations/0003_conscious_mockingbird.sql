CREATE SCHEMA "hodowlakoni";
--> statement-breakpoint
CREATE TYPE "hodowlakoni"."plcie" AS ENUM('samiec', 'samica');--> statement-breakpoint
CREATE TYPE "hodowlakoni"."rodzaje_koni" AS ENUM('Konie hodowlane', 'Konie rekreacyjne', 'Źrebaki', 'Konie sportowe');--> statement-breakpoint
CREATE TYPE "hodowlakoni"."rodzaje_zdarzen_profilaktycznych" AS ENUM('Odrobaczanie', 'Podanie suplementów', 'Szczepienie', 'Dentysta', 'Inne');--> statement-breakpoint
CREATE TYPE "hodowlakoni"."rodzaje_zdarzen_rozrodczych" AS ENUM('Inseminacja konia', 'Sprawdzenie źrebności', 'Wyźrebienie', 'Inne');--> statement-breakpoint
CREATE TABLE "hodowlakoni"."choroby" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"data_rozpoczecia" date DEFAULT now() NOT NULL,
	"data_zakonczenia" date,
	"opis_zdarzenia" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" varchar NOT NULL,
	"mimetype" varchar NOT NULL,
	"data" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."hodowcy_koni" (
	"id" serial PRIMARY KEY NOT NULL,
	"nazwa" varchar,
	"numer_telefonu" varchar(15) NOT NULL,
	"email" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."konie" (
	"id" serial PRIMARY KEY NOT NULL,
	"numer_przyzyciowy" varchar(15) NOT NULL,
	"numer_chipa" varchar(15) NOT NULL,
	"rocznik_urodzenia" integer DEFAULT extract(year from CURRENT_DATE),
	"data_przybycia_do_stajni" date DEFAULT now(),
	"data_odejscia_ze_stajni" date,
	"hodowla" integer,
	"rodzaj_konia" "hodowlakoni"."rodzaje_koni" NOT NULL,
	"plec" "hodowlakoni"."plcie",
	CONSTRAINT "konie_numer_przyzyciowy_unique" UNIQUE("numer_przyzyciowy"),
	CONSTRAINT "konie_numer_chipa_unique" UNIQUE("numer_chipa"),
	CONSTRAINT "odejscie_pozniej_niz_przybycie" CHECK ((data_odejscia_ze_stajni is null and data_przybycia_do_stajni is null) or data_przybycia_do_stajni < data_odejscia_ze_stajni)
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."kowale" (
	"id" serial PRIMARY KEY NOT NULL,
	"imie_i_nazwisko" varchar NOT NULL,
	"numer_telefonu" varchar(15) NOT NULL,
	"hodowla" integer
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."leczenia" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"weterynarz" integer,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"opis_zdarzenia" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."podkucia" (
	"id" serial PRIMARY KEY NOT NULL,
	"data_zdarzenia" date,
	"data_waznosci" date,
	"kon" integer,
	"kowal" integer
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."rozrody" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"weterynarz" integer,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"rodzaj_zdarzenia" "hodowlakoni"."rodzaje_zdarzen_rozrodczych" NOT NULL,
	"opis_zdarzenia" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."weterynarze" (
	"id" serial PRIMARY KEY NOT NULL,
	"imie_i_nazwisko" varchar NOT NULL,
	"numer_telefonu" varchar(15) NOT NULL,
	"hodowla" integer
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."zdarzenia_profilaktyczne" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"weterynarz" integer,
	"data_zdarzenia" date DEFAULT now(),
	"data_waznosci" date,
	"rodzaj_zdarzenia" "hodowlakoni"."rodzaje_zdarzen_profilaktycznych" NOT NULL,
	"opis_zdarzenia" varchar
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."zdjecia_koni" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kon" integer,
	"file" uuid NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL
);
--> statement-breakpoint
DROP TABLE "hodowlakoni1"."choroby" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."files" CASCADE;--> statement-breakpoint
DROP TABLE "hodowcy_koni" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."konie" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."kowale" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."leczenia" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."podkucia" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."rozrody" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."weterynarze" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."zdarzenia_profilaktyczne" CASCADE;--> statement-breakpoint
DROP TABLE "hodowlakoni1"."zdjecia_koni" CASCADE;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."choroby" ADD CONSTRAINT "choroby_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."konie" ADD CONSTRAINT "konie_hodowla_hodowcy_koni_id_fk" FOREIGN KEY ("hodowla") REFERENCES "hodowlakoni"."hodowcy_koni"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."kowale" ADD CONSTRAINT "kowale_hodowla_hodowcy_koni_id_fk" FOREIGN KEY ("hodowla") REFERENCES "hodowlakoni"."hodowcy_koni"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."leczenia" ADD CONSTRAINT "leczenia_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."leczenia" ADD CONSTRAINT "leczenia_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "hodowlakoni"."weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."podkucia" ADD CONSTRAINT "podkucia_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."podkucia" ADD CONSTRAINT "podkucia_kowal_kowale_id_fk" FOREIGN KEY ("kowal") REFERENCES "hodowlakoni"."kowale"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."rozrody" ADD CONSTRAINT "rozrody_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."rozrody" ADD CONSTRAINT "rozrody_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "hodowlakoni"."weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."weterynarze" ADD CONSTRAINT "weterynarze_hodowla_hodowcy_koni_id_fk" FOREIGN KEY ("hodowla") REFERENCES "hodowlakoni"."hodowcy_koni"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdarzenia_profilaktyczne" ADD CONSTRAINT "zdarzenia_profilaktyczne_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdarzenia_profilaktyczne" ADD CONSTRAINT "zdarzenia_profilaktyczne_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "hodowlakoni"."weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" ADD CONSTRAINT "zdjecia_koni_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" ADD CONSTRAINT "zdjecia_koni_file_files_id_fk" FOREIGN KEY ("file") REFERENCES "hodowlakoni"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "hodowlakoni1"."plcie";--> statement-breakpoint
DROP TYPE "hodowlakoni1"."rodzaje_koni";--> statement-breakpoint
DROP TYPE "hodowlakoni1"."rodzaje_zdarzen_profilaktycznych";--> statement-breakpoint
DROP TYPE "hodowlakoni1"."rodzaje_zdarzen_rozrodczych";--> statement-breakpoint
DROP SCHEMA "hodowlakoni1";
