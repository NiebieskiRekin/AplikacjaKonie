import { z } from "@hono/zod-openapi";

export const podkucieSchema = z.object({
  konieId: z.array(z.number().positive()),
  kowal: z.number().positive(),
  dataZdarzenia: z.string().date(),
  dataWaznosci: z.string().date().optional(),
});
