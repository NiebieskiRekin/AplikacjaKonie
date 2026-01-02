import { z } from "zod";

export const zdarzenieProfilaktyczneSchema = z.object({
  konieId: z.array(z.number().positive()),
  weterynarz: z.number().positive(),
  dataZdarzenia: z.iso.date(),
  dataWaznosci: z.iso.date().optional(),
  rodzajZdarzenia: z.enum([
    "Odrobaczanie",
    "Podanie suplementów",
    "Szczepienie",
    "Dentysta",
    "Inne",
  ]),
  opisZdarzenia: z.string().optional(),
});
