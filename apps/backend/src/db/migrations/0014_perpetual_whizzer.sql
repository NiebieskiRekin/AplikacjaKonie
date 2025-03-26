CREATE TABLE "hodowlakoni"."notification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar,
	"user" integer NOT NULL,
	CONSTRAINT "notification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "hodowlakoni"."notification_tokens" ADD CONSTRAINT "notification_tokens_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "hodowlakoni"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" DROP COLUMN "file";--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" DROP COLUMN "width";--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" DROP COLUMN "height";