CREATE TYPE "hodowlakoni"."user_roles" AS ENUM('właściciel', 'członek', 'viewer');--> statement-breakpoint
CREATE TABLE "hodowlakoni"."user_permissions" (
	"user_id" integer NOT NULL,
	"role" "hodowlakoni"."user_roles" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hodowlakoni"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"hodowla" integer NOT NULL,
	"created_at" date DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "hodowlakoni"."choroby" ALTER COLUMN "kon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."konie" ALTER COLUMN "hodowla" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."kowale" ALTER COLUMN "hodowla" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."leczenia" ALTER COLUMN "kon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."leczenia" ALTER COLUMN "weterynarz" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."podkucia" ALTER COLUMN "data_zdarzenia" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "hodowlakoni"."podkucia" ALTER COLUMN "kon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."podkucia" ALTER COLUMN "kowal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."rozrody" ALTER COLUMN "kon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."rozrody" ALTER COLUMN "weterynarz" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."weterynarze" ALTER COLUMN "hodowla" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdarzenia_profilaktyczne" ALTER COLUMN "kon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdarzenia_profilaktyczne" ALTER COLUMN "weterynarz" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdarzenia_profilaktyczne" ALTER COLUMN "data_zdarzenia" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdarzenia_profilaktyczne" ALTER COLUMN "opis_zdarzenia" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" ALTER COLUMN "kon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."konie" ADD COLUMN "nazwa" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "hodowlakoni"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."users" ADD CONSTRAINT "users_hodowla_hodowcy_koni_id_fk" FOREIGN KEY ("hodowla") REFERENCES "hodowlakoni"."hodowcy_koni"("id") ON DELETE no action ON UPDATE no action;