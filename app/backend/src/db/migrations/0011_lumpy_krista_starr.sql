ALTER TABLE "hodowlakoni"."user_permissions" DROP CONSTRAINT "user_permissions_hodowla_hodowcy_koni_id_fk";
--> statement-breakpoint
ALTER TABLE "hodowlakoni"."users" ADD COLUMN "hodowla" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."users" ADD CONSTRAINT "users_hodowla_hodowcy_koni_id_fk" FOREIGN KEY ("hodowla") REFERENCES "hodowlakoni"."hodowcy_koni"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."user_permissions" DROP COLUMN "hodowla";