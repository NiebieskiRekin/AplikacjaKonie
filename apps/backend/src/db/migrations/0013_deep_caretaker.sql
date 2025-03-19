CREATE TYPE "hodowlakoni"."rodzaje_notifications" AS ENUM('Podkucia', 'Odrobaczanie', 'Podanie suplementów', 'Szczepienie', 'Dentysta', 'Inne');--> statement-breakpoint
CREATE TYPE "hodowlakoni"."rodzaje_wysylania_notifications" AS ENUM('Push', 'Email', 'Oba', 'Żadne');--> statement-breakpoint
CREATE TABLE "hodowlakoni"."notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rodzaje_notifications" "hodowlakoni"."rodzaje_notifications" NOT NULL,
	"days" integer NOT NULL,
	"time" time(6) with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"rodzaje_wysylania_notifications" "hodowlakoni"."rodzaje_wysylania_notifications" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hodowlakoni"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "hodowlakoni"."users"("id") ON DELETE no action ON UPDATE no action;