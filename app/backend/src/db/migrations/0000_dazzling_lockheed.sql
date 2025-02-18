CREATE SCHEMA "hodowlakoni1";
--> statement-breakpoint
CREATE TYPE "hodowlakoni1"."plcie" AS ENUM('samiec', 'samica');--> statement-breakpoint
CREATE TYPE "hodowlakoni1"."rodzaje_koni" AS ENUM('Konie hodowlane', 'Konie rekreacyjne', 'Źrebaki', 'Konie sportowe');--> statement-breakpoint
CREATE TYPE "hodowlakoni1"."rodzaje_zdarzen_profilaktycznych" AS ENUM('Odrobaczanie', 'Podanie suplementów', 'Szczepienie', 'Dentysta', 'Inne');--> statement-breakpoint
CREATE TYPE "hodowlakoni1"."rodzaje_zdarzen_rozrodczych" AS ENUM('Inseminacja konia', 'Sprawdzenie źrebności', 'Wyźrebienie', 'Inne');--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."choroby" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"data_rozpoczecia" date DEFAULT now() NOT NULL,
	"data_zakonczenia" date,
	"opis_zdarzenia" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" varchar NOT NULL,
	"mimetype" varchar NOT NULL,
	"data" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowcy_koni" (
	"id" serial PRIMARY KEY NOT NULL,
	"nazwa" varchar,
	"schema" varchar
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."konie" (
	"id" serial PRIMARY KEY NOT NULL,
	"numer_przyzyciowy" varchar(15) NOT NULL,
	"numer_chipa" varchar(15) NOT NULL,
	"rocznik_urodzenia" integer DEFAULT extract(year from CURRENT_DATE),
	"data_przybycia_do_stajni" date DEFAULT now(),
	"data_odejscia_ze_stajni" date,
	"rodzaj_konia" "hodowlakoni1"."rodzaje_koni" NOT NULL,
	"plec" "hodowlakoni1"."plcie",
	CONSTRAINT "konie_numer_przyzyciowy_unique" UNIQUE("numer_przyzyciowy"),
	CONSTRAINT "konie_numer_chipa_unique" UNIQUE("numer_chipa"),
	CONSTRAINT "odejscie_pozniej_niz_przybycie" CHECK ((data_odejscia_ze_stajni is null and data_przybycia_do_stajni is null) or data_przybycia_do_stajni < data_odejscia_ze_stajni)
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."kowale" (
	"id" serial PRIMARY KEY NOT NULL,
	"imie_i_nazwisko" varchar NOT NULL,
	"numer_telefonu" varchar(15),
	CONSTRAINT "numer_telefonu" CHECK (regexp_like(numer_telefonu,'[sd+-]*','gi'))
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."leczenia" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"weterynarz" integer,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"opis_zdarzenia" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."podkucia" (
	"id" serial PRIMARY KEY NOT NULL,
	"data_zdarzenia" date,
	"data_waznosci" date,
	"kon" integer,
	"kowal" integer
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."rozrody" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"weterynarz" integer,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"rodzaj_zdarzenia" "hodowlakoni1"."rodzaje_zdarzen_rozrodczych" NOT NULL,
	"opis_zdarzenia" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."weterynarze" (
	"id" serial PRIMARY KEY NOT NULL,
	"imie_i_nazwisko" varchar NOT NULL,
	"numer_telefonu" varchar(15),
	CONSTRAINT "numer_telefonu" CHECK (regexp_like(numer_telefonu,'[sd+-]*','gi'))
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."zdarzenia_profilaktyczne" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer,
	"weterynarz" integer,
	"data_zdarzenia" date DEFAULT now(),
	"data_waznosci" date,
	"rodzaj_zdarzenia" "hodowlakoni1"."rodzaje_zdarzen_profilaktycznych" NOT NULL,
	"opis_zdarzenia" varchar
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni1"."zdjecia_koni" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kon" integer PRIMARY KEY NOT NULL,
	"file" uuid NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."choroby" ADD CONSTRAINT "choroby_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni1"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."leczenia" ADD CONSTRAINT "leczenia_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni1"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."leczenia" ADD CONSTRAINT "leczenia_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "hodowlakoni1"."weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."podkucia" ADD CONSTRAINT "podkucia_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni1"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."podkucia" ADD CONSTRAINT "podkucia_kowal_kowale_id_fk" FOREIGN KEY ("kowal") REFERENCES "hodowlakoni1"."kowale"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."rozrody" ADD CONSTRAINT "rozrody_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni1"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."rozrody" ADD CONSTRAINT "rozrody_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "hodowlakoni1"."weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."zdarzenia_profilaktyczne" ADD CONSTRAINT "zdarzenia_profilaktyczne_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni1"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."zdarzenia_profilaktyczne" ADD CONSTRAINT "zdarzenia_profilaktyczne_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "hodowlakoni1"."weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."zdjecia_koni" ADD CONSTRAINT "zdjecia_koni_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "hodowlakoni1"."konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."zdjecia_koni" ADD CONSTRAINT "zdjecia_koni_file_files_id_fk" FOREIGN KEY ("file") REFERENCES "hodowlakoni1"."files"("id") ON DELETE no action ON UPDATE no action;