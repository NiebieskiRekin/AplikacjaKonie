ALTER TABLE "hodowlakoni1"."kowale" ALTER COLUMN "numer_telefonu" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."weterynarze" ALTER COLUMN "numer_telefonu" SET NOT NULL;--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'hodowlakoni1'
                AND table_name = 'zdjecia_koni'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "zdjecia_koni" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "hodowlakoni1"."zdjecia_koni" ALTER COLUMN "kon" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowcy_koni" ADD COLUMN "numer_telefonu" varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowcy_koni" ADD COLUMN "email" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "hodowcy_koni" ADD CONSTRAINT "numer_telefonu" CHECK (regexp_like(numer_telefonu,'[sd+-]*','gi'));