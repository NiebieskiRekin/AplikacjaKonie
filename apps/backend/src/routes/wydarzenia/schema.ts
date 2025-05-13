import { z } from "@hono/zod-openapi";
import {
  RodzajeZdarzenProfilaktycznych,
  RodzajeZdarzenRozrodczych,
} from "@/backend/db/types";

const common = z.object({
  _id: z.number(),
  nazwaKonia: z.string(),
});

export const eventTypeUnionSchema = z.array(
  z.union([
    common.extend({
      dataRozpoczecia: z.string().date(),
      dataZakonczenia: z.string().date().nullable(),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      weterynarz: z.string(),
      choroba: z.string().nullable(),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      weterynarz: z.string(),
      rodzajZdarzenia: z.enum(RodzajeZdarzenRozrodczych),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      dataWaznosci: z.string().date().nullable(),
      weterynarz: z.string(),
      rodzajZdarzenia: z.enum(RodzajeZdarzenProfilaktycznych),
      opisZdarzenia: z.string().nullable(),
    }),
    common.extend({
      dataZdarzenia: z.string().date(),
      dataWaznosci: z.string().date().nullable(),
      kowal: z.string(),
    }),
  ])
);
