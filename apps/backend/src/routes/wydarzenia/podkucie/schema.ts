import { z } from "@hono/zod-openapi";

export const podkucieSchema = z.object({
  konieId: z.array(z.number().positive()),
  kowal: z.number().positive(),
  dataZdarzenia: z.iso.date(),
  dataWaznosci: z.iso.date().optional(),
});
