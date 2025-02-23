ALTER TABLE "hodowlakoni"."hodowcy_koni" ALTER COLUMN "nazwa" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."hodowcy_koni" ALTER COLUMN "numer_telefonu" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."kowale" ALTER COLUMN "numer_telefonu" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."weterynarze" ALTER COLUMN "numer_telefonu" DROP NOT NULL;