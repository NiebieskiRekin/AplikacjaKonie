import { z } from "zod";

export const zdarzenieProfilaktyczneSchema = z.object({
  konieId: z.array(z.number().positive()),
  weterynarz: z.number().positive(),
  dataZdarzenia: z.string().date(),
  dataWaznosci: z.string().date().optional(),
  rodzajZdarzenia: z.enum([
    "Odrobaczanie",
    "Podanie suplementów",
    "Szczepienie",
    "Dentysta",
    "Inne",
  ]),
  opisZdarzenia: z.string().optional(),
});
