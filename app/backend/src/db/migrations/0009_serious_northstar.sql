ALTER TABLE "hodowlakoni"."users" DROP CONSTRAINT "users_hodowla_hodowcy_koni_id_fk";
--> statement-breakpoint
ALTER TABLE "hodowlakoni"."choroby" ALTER COLUMN "opis_zdarzenia" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."leczenia" ALTER COLUMN "opis_zdarzenia" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."rozrody" ALTER COLUMN "opis_zdarzenia" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdarzenia_profilaktyczne" ALTER COLUMN "opis_zdarzenia" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();--> statement-breakpoint
ALTER TABLE "hodowlakoni"."leczenia" ADD COLUMN "choroba" integer;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."user_permissions" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."user_permissions" ADD COLUMN "hodowla" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."users" ADD COLUMN "refresh_token_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."leczenia" ADD CONSTRAINT "leczenia_choroba_choroby_id_fk" FOREIGN KEY ("choroba") REFERENCES "hodowlakoni"."choroby"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."user_permissions" ADD CONSTRAINT "user_permissions_hodowla_hodowcy_koni_id_fk" FOREIGN KEY ("hodowla") REFERENCES "hodowlakoni"."hodowcy_koni"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."users" DROP COLUMN "hodowla";