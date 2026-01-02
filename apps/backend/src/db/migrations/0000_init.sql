CREATE TYPE "plcie" AS ENUM('klacz', 'ogier', 'wałach');--> statement-breakpoint
CREATE TYPE "rodzaje_koni" AS ENUM('Konie hodowlane', 'Konie rekreacyjne', 'Źrebaki', 'Konie sportowe');--> statement-breakpoint
CREATE TYPE "rodzaje_notifications" AS ENUM('Podkucia', 'Odrobaczanie', 'Podanie suplementów', 'Szczepienie', 'Dentysta', 'Inne');--> statement-breakpoint
CREATE TYPE "rodzaje_wysylania_notifications" AS ENUM('Push', 'Email', 'Oba');--> statement-breakpoint
CREATE TYPE "rodzaje_zdarzen_profilaktycznych" AS ENUM('Odrobaczanie', 'Podanie suplementów', 'Szczepienie', 'Dentysta', 'Inne');--> statement-breakpoint
CREATE TYPE "rodzaje_zdarzen_rozrodczych" AS ENUM('Inseminacja konia', 'Sprawdzenie źrebności', 'Wyźrebienie', 'Inne');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "choroby" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer NOT NULL,
	"data_rozpoczecia" date DEFAULT now() NOT NULL,
	"data_zakonczenia" date,
	"opis_zdarzenia" varchar
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"public_key" text NOT NULL,
	"private_key" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "konie" (
	"id" serial PRIMARY KEY NOT NULL,
	"nazwa" text NOT NULL,
	"numer_przyzyciowy" varchar(15),
	"numer_chipa" varchar(15),
	"rocznik_urodzenia" integer DEFAULT extract(year from now()),
	"data_przybycia_do_stajni" date DEFAULT now(),
	"data_odejscia_ze_stajni" date,
	"hodowla" text NOT NULL,
	"rodzaj_konia" "rodzaje_koni" NOT NULL,
	"plec" "plcie",
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "odejscie_pozniej_niz_przybycie" CHECK ((data_odejscia_ze_stajni is null or data_przybycia_do_stajni is null) or data_przybycia_do_stajni <= data_odejscia_ze_stajni),
	CONSTRAINT "przybycie_nie_wczesniej_niz_rocznik_urodzenia" CHECK ((data_odejscia_ze_stajni is null or data_przybycia_do_stajni is null) or extract(year from data_przybycia_do_stajni) >= rocznik_urodzenia ),
	CONSTRAINT "data_przybycia_wymagana_przy_dacie_odejscia" CHECK (not (data_odejscia_ze_stajni is not null and data_przybycia_do_stajni is null))
);
--> statement-breakpoint
CREATE TABLE "kowale" (
	"id" serial PRIMARY KEY NOT NULL,
	"imie_i_nazwisko" varchar NOT NULL,
	"numer_telefonu" varchar(15),
	"hodowla" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leczenia" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer NOT NULL,
	"weterynarz" integer NOT NULL,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"opis_zdarzenia" varchar,
	"choroba" integer
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"rodzaje_notifications" "rodzaje_notifications" NOT NULL,
	"days" integer NOT NULL,
	"time" time(6) with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"rodzaje_wysylania_notifications" "rodzaje_wysylania_notifications" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"liczba_requestow" integer DEFAULT 0 NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "podkucia" (
	"id" serial PRIMARY KEY NOT NULL,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"data_waznosci" date,
	"kon" integer NOT NULL,
	"kowal" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rozrody" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer NOT NULL,
	"weterynarz" integer NOT NULL,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"rodzaj_zdarzenia" "rodzaje_zdarzen_rozrodczych" NOT NULL,
	"opis_zdarzenia" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weterynarze" (
	"id" serial PRIMARY KEY NOT NULL,
	"imie_i_nazwisko" text NOT NULL,
	"numer_telefonu" varchar(15),
	"hodowla" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zdarzenia_profilaktyczne" (
	"id" serial PRIMARY KEY NOT NULL,
	"kon" integer NOT NULL,
	"weterynarz" integer NOT NULL,
	"data_zdarzenia" date DEFAULT now() NOT NULL,
	"data_waznosci" date,
	"rodzaj_zdarzenia" "rodzaje_zdarzen_profilaktycznych" NOT NULL,
	"opis_zdarzenia" text
);
--> statement-breakpoint
CREATE TABLE "zdjecia_koni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kon" integer NOT NULL,
	"default" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choroby" ADD CONSTRAINT "choroby_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "konie" ADD CONSTRAINT "konie_hodowla_organization_id_fk" FOREIGN KEY ("hodowla") REFERENCES "organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kowale" ADD CONSTRAINT "kowale_hodowla_organization_id_fk" FOREIGN KEY ("hodowla") REFERENCES "organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leczenia" ADD CONSTRAINT "leczenia_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leczenia" ADD CONSTRAINT "leczenia_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leczenia" ADD CONSTRAINT "leczenia_choroba_choroby_id_fk" FOREIGN KEY ("choroba") REFERENCES "choroby"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podkucia" ADD CONSTRAINT "podkucia_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podkucia" ADD CONSTRAINT "podkucia_kowal_kowale_id_fk" FOREIGN KEY ("kowal") REFERENCES "kowale"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rozrody" ADD CONSTRAINT "rozrody_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rozrody" ADD CONSTRAINT "rozrody_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weterynarze" ADD CONSTRAINT "weterynarze_hodowla_organization_id_fk" FOREIGN KEY ("hodowla") REFERENCES "organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zdarzenia_profilaktyczne" ADD CONSTRAINT "zdarzenia_profilaktyczne_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zdarzenia_profilaktyczne" ADD CONSTRAINT "zdarzenia_profilaktyczne_weterynarz_weterynarze_id_fk" FOREIGN KEY ("weterynarz") REFERENCES "weterynarze"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zdjecia_koni" ADD CONSTRAINT "zdjecia_koni_kon_konie_id_fk" FOREIGN KEY ("kon") REFERENCES "konie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" USING btree ("key");--> statement-breakpoint
CREATE INDEX "apikey_userId_idx" ON "apikey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");