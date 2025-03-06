ALTER TABLE "hodowlakoni"."files" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "hodowlakoni"."files" CASCADE;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."konie" DROP CONSTRAINT "odejscie_pozniej_niz_przybycie";--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" DROP CONSTRAINT "zdjecia_koni_file_files_id_fk";
--> statement-breakpoint
ALTER TABLE "hodowlakoni"."zdjecia_koni" ALTER COLUMN "file" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "hodowlakoni"."konie" ADD CONSTRAINT "odejscie_pozniej_niz_przybycie" CHECK ((data_odejscia_ze_stajni is null or data_przybycia_do_stajni is null) or data_przybycia_do_stajni <= data_odejscia_ze_stajni);